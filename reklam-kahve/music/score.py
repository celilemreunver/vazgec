"""Vazgeçme Kumbaram — oyun programı müziği: sentez davul/bas/brass + örnekli marimba/glockenspiel, görüntü olaylarından efektler.
120 BPM, 24.5 sn. Çalıştırma: /root/lemo-opuscar/.venv/bin/python music/score.py"""
import os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, '/root/lemo-opuscar')
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit
S.seed(3)
BEAT = .5; BAR = 2.0; DUR = 22.3; N = int(DUR * SR)
STOP, BOARD, HEAD, DEC, TAP, R4, GOAL, SMOKE, R5 = 1.7, 3.0, 5.0, 7.3, 7.7, 9.8, 14.4, 15.4, 18.3
MATH = [5.3, 5.8, 6.3]
music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
sos = lambda kind, f, o=2: butter(o, f, kind, fs=SR, output='sos')
rng = np.random.default_rng(1)

def kick(t, v=1.):
    x = tt(.35); f = 48 + 70 * np.exp(-x * 22); y = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9) * 1.1) * v
    y *= np.minimum(1, x / .003); y = sosfilt(sos('low', 250), y)
    add(music, y.astype(np.float32), t, 1.0, 0)
def clap(t, v=1.):
    y = sosfilt(sos('band', [900, 3500]), rng.standard_normal(int(.2 * SR))) * np.exp(-tt(.2) * 22) * v * .9
    for k in range(3): add(music, y.astype(np.float32), t + k * .008, .3, (k - 1) * .2)
def hat(t, v=.5, open_=False):
    d = .18 if open_ else .05; y = sosfilt(sos('high', 7000), rng.standard_normal(int(d * SR))) * np.exp(-tt(d) * (12 if open_ else 60)) * v
    add(music, y.astype(np.float32), t, .5, .3)
def saw(f, d, det=.006):
    x = tt(d); y = sum(2 * ((x * f * (1 + k * det)) % 1) - 1 for k in (-1, 0, 1)) / 3; return y
def bass(t, note, d=.42, v=.7):
    f = 440 * 2 ** ((S.midi(note) - 69) / 12); y = saw(f, d, .003)
    y = sosfilt(sos('low', 900), y) * np.minimum(1, tt(d) / .005) * np.exp(-tt(d) * 4) * v
    add(music, y.astype(np.float32), t, .8, -.05)
def brass(t, notes, d=.3, v=.5):
    for n in notes:
        f = 440 * 2 ** ((S.midi(n) - 69) / 12); x = tt(d)
        y = saw(f, d, .008); cut = 600 + 4000 * np.exp(-x * 9)
        out = np.zeros_like(y); seg = 512
        for i in range(0, len(y), seg): out[i:i + seg] = sosfilt(sos('low', float(min(cut[i], 18000))), y[i:i + seg])
        out *= np.minimum(1, x / .01) * np.exp(-x * 3) * v / len(notes) * 1.8
        add(music, out.astype(np.float32), t - .008, .9, .1)
def sample(buf, inst, note, d, v, t, gain=1., pan=0.):
    add(buf, S.note(inst, note, d, v), t, gain, pan)

CH = [['C', 'C3', ['E4', 'G4', 'C5']], ['G', 'G2', ['D4', 'G4', 'B4']], ['A', 'A2', ['C4', 'E4', 'A4']], ['F', 'F2', ['C4', 'F4', 'A4']]]
def groove(b0, b1, drums=True, transpose=0):
    for b in range(b0, b1):
        t0 = b * BAR; name, root, tri = CH[b % 4]
        up = lambda n, k=transpose: S.name(S.midi(n) + k)
        for i in range(4):
            t = t0 + i * BEAT
            if drums:
                kick(t, .9 if i % 2 == 0 else .6)
                if i % 2: clap(t)
                hat(t + BEAT / 2, .35); hat(t, .25)
            bass(t, up(root) if i % 2 == 0 else up(S.name(S.midi(root) + 7)))
            bass(t + BEAT * .75, up(S.name(S.midi(root) + 12)), .15, .45)
        for i in (1, 3):
            for n in tri: sample(music, 'marimba', up(n), .3, .55, t0 + i * BEAT, .45, .15)
def jingle(t):
    brass(t, ['C5', 'E5', 'G5'], .25, .6); brass(t + .25, ['D5', 'F5', 'A5'], .25, .6); brass(t + .5, ['E5', 'G5', 'C6'], .4, .7)
    add(music, S.hit('crash', None, .55), t + .5, .38, .1)

# ===== düzenleme =====
groove(0, 1, drums=False)                          # sokak: yürüyüş (bas + marimba)
for i in range(4): hat(i * BEAT * .5 + 0.0, .25); 
for i in range(int(STOP / (BEAT / 2))): hat(i * BEAT / 2, .22)
brass(BOARD, ['C4', 'Eb4', 'Gb4'], .5, .6); add(music, S.hit('crash', None, .5), BOARD, .35, 0)   # fiyatı görür: gerilim akoru
groove(2, 4, transpose=2)                          # kafadan hesap + karar
groove(4, 9)                                       # uygulama
groove(9, 12, transpose=2)                         # final
for t in (DEC, R4, R5): jingle(t - .5)

# ===== olay efektleri =====
def pop(t, pitch='C6', v=.45): sample(fx, 'glockenspiel', pitch, .2, v, t, .5, .2)
def ding(t): sample(fx, 'glockenspiel', 'G6', .6, .6, t, .6, 0); sample(fx, 'glockenspiel', 'C7', .6, .5, t + .06, .5, 0)
def chaching(t):
    for i, n in enumerate(['E6', 'G6', 'C7']): sample(fx, 'glockenspiel', n, .5, .6, t + i * .04, .55, .1)
    y = sosfilt(sos('high', 5000), rng.standard_normal(int(.25 * SR))) * np.exp(-tt(.25) * 14) * .3; add(fx, y.astype(np.float32), t, .5, .2)
def boing(t, v=.4):
    x = tt(.5); f = 260 * (1 + .9 * np.exp(-x * 9)) * (1 + .1 * np.sin(2 * np.pi * 16 * x) * np.exp(-x * 3))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 5) * v; add(fx, y.astype(np.float32), t, .7, -.1)
def click(t, v=.8): y = sosfilt(sos('band', [1500, 6000]), rng.standard_normal(int(.03 * SR))) * np.exp(-tt(.03) * 120) * v; add(fx, y.astype(np.float32), t, .7, 0)
def beep(t, f=1800, d=.07): x = tt(d); y = np.sign(np.sin(2 * np.pi * f * x)) * .12 * np.minimum(1, (d - x) / .01); y = sosfilt(sos('low', 5000), y); add(fx, y.astype(np.float32), t, .5, .15)
def whoosh(t):
    d = .35; y = sosfilt(sos('band', [400, 3000]), rng.standard_normal(int(d * SR))) * np.sin(np.linspace(0, np.pi, int(d * SR))) * .25; add(fx, y.astype(np.float32), t - d * .6, .6, 0)

for i in range(int(STOP / .3)): click(.1 + i * .3, .25)                                     # ayak sesleri
pop(.45, 'E6', .4)                                                                           # düşünce balonu
for i in range(8): pop(.1 + i * .045, ['C6', 'D6', 'E6', 'G6'][i % 4], .28)
whoosh(BOARD); boing(BOARD + .42, .4)                                                        # "120 TL mi?!"
whoosh(HEAD)
for i in range(18): click(HEAD + .1 + i * .05, .35)                                          # KAFADAN HESAP harfleri
for j, t0 in enumerate(MATH):                                                                # hesap makinesi bipleri + ding
    for k in range(3): beep(t0 - .2 + k * .06, 1600 + 300 * k)
    ding(t0)
add(fx, S.hit('crash', None, .55), MATH[2], .35, 0)
whoosh(DEC); click(TAP); chaching(TAP + .95); pop(TAP + 1.0, 'C7', .5)
for t in (R4, GOAL, SMOKE, R5): whoosh(t)
click(R4 + .25); chaching(R4 + 2.9)                                                          # kayıttaki dokunuş ve kumbaraya atma
for i in range(8): pop(R5 + .1 + i * .05, ['C6', 'E6', 'G6', 'C7'][i % 4], .18)   # VAZGEÇME (konuşmadan önce)
# KUMBARAM harfleri konuşmanın üstüne denk geldiği için sessiz
fin = 21.55
brass(fin, ['D5', 'F#5', 'A5', 'D6'], .9, .7); add(music, S.hit('crash', None, .6), fin, .4, 0)

# ===== denge =====
fo = int((DUR - .7) * SR); music[fo:] *= np.linspace(1, 0, N - fo)[:, None]
music = S.room(music, size=.18, mix=.1); fx = S.room(fx, size=.15, mix=.08)
mix = music * .8 + fx * .9
mix *= .84 / float(np.quantile(np.abs(mix), .9999))
mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1).astype(np.float32)
sf.write(os.path.join(HERE, 'score.wav'), mix, SR, subtype='PCM_24')
print('score.wav', DUR, 's; tepe', round(float(np.abs(mix).max()), 3))
