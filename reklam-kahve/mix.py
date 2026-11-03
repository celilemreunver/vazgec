"""Son karışım: müzik + seslendirme (sunucu ve adam: temiz) + konuşma altında -7 dB kısma."""
import os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, '/root/lemo-opuscar')
from core.audio.sfx import SR, add, limit
DUR = 24.5; N = int(DUR * SR)
VO = [('h1', .3, 'clean'), ('a1', 6.35, 'clean'), ('h2', 12.2, 'clean'), ('h3', 20.8, 'clean')]
sos = lambda kind, f: butter(2, f, kind, fs=SR, output='sos')
music, _ = sf.read(os.path.join(HERE, 'music/score.wav'), dtype='float32'); music = music[:N]
voice = np.zeros((N, 2), np.float32); active = np.zeros(N, np.float32)
for name, at, kind in VO:
    x, sr = sf.read(os.path.join(HERE, 'vo', name + '.wav'), dtype='float32'); assert sr == SR
    if kind == 'tape': x = sosfilt(sos('band', [200, 6500]), x); x = np.tanh(x * 1.2) / 1.2
    x = x.astype(np.float32); add(voice, x, at, 1.0, 0.0)
    a = int(at * SR); active[a:a + len(x)] = 1
k = int(.08 * SR); env = np.convolve(active, np.ones(k) / k, mode='same')
duck = (1 - env * (1 - 10 ** (-10 / 20))).astype(np.float32)
mix = music * duck[:, None] * .85 + voice * 1.05
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1).astype(np.float32)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR, subtype='PCM_24')
print('mix.wav tepe', round(float(np.abs(mix).max()), 3))
