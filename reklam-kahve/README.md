# Vazgeçme Kumbaram — "Bu kahve kaça mal oluyor?" reklamı (Reels, 24,5 sn, 1080×1920)

- `vazgecme-kumbaram-kahve.mp4` — bitmiş film
- Stil: Lemo-Opuscar **game-show** kuralları (düz renk, kalın kontur, sert gölge, vuruş ızgarası, damga kelimeler); çizim kodu `main.js`.
- Uygulama bölümü gerçek ekran görüntüleri (`img/`); seslendirme Gemini TTS (`vo/`); müzik sentez + CC0 örnekler (`music/score.py`).
- Hesap: 120 TL × 365 gün = 43.800 TL. Sayaç uygulamadaki gibi 3.956 TL'de biter.

Yeniden üretmek (Lemo-Opuscar kurulu, kütüphane `~/lemo-opuscar`):
```sh
LIB=~/lemo-opuscar; P=$(pwd)
$LIB/.venv/bin/python music/score.py && $LIB/.venv/bin/python mix.py
cd $LIB && node core/render/video.mjs "$P" --fps 24 --size 1080x1920 --out "$P/out/video24.mp4"
sh core/render/mux.sh "$P/out/video24.mp4" "$P/out/mix.wav" "$P/vazgecme-kumbaram-kahve.mp4" 24 0
```
Yazı tipi: Baloo 2 (SIL OFL 1.1, `fonts/`).
