"""Son karışım: müzik + seslendirme (sunucu ve adam: temiz) + konuşma altında -7 dB kısma."""
import os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, '/root/lemo-opuscar')
from core.audio.sfx import SR, add, limit
DUR = 22.3; N = int(DUR * SR)
VO = [('m1', .4, 'clean'), ('a1', 7.65, 'clean'), ('h2', 10.0, 'clean'), ('h3', 18.6, 'clean')]
sos = lambda kind, f: butter(2, f, kind, fs=SR, output='sos')
music, _ = sf.read(os.path.join(HERE, 'music/score.wav'), dtype='float32'); music = music[:N]
voice = np.zeros((N, 2), np.float32); active = np.zeros(N, np.float32)
for name, at, kind in VO:
    x, sr = sf.read(os.path.join(HERE, 'vo', name + '.wav'), dtype='float32'); assert sr == SR
    if kind == 'tape': x = sosfilt(sos('band', [200, 6500]), x); x = np.tanh(x * 1.2) / 1.2
    x = x.astype(np.float32); add(voice, x, at, 1.0, 0.0)
    a = int(at * SR); active[a:a + len(x)] = 1
k = int(.08 * SR); env = np.convolve(active, np.ones(k) / k, mode='same')
duck = (1 - env * (1 - 10 ** (-12 / 20))).astype(np.float32)
# isim anı: 'Vazgeçme Kumbaram' söylenirken müzik neredeyse susar (oyun programı vurgusu)
nm = np.ones(N, np.float32); a0, a1 = int(18.8 * SR), int(20.3 * SR); f = int(.08 * SR)
nm[a0:a1] = 10 ** (-26 / 20); nm[a0 - f:a0] = np.linspace(1, nm[a0], f); nm[a1:a1 + f] = np.linspace(nm[a0], 1, f)
mix = music * (duck * nm)[:, None] * .85 + voice * 1.05
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1).astype(np.float32)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR, subtype='PCM_24')
print('mix.wav tepe', round(float(np.abs(mix).max()), 3))
