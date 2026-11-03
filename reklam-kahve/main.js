// main.js — "Vazgeçme Kumbaram: Kahve" (1080×1920, 24 fps). Lemo-Opuscar game-show stil kurallarıyla: düz renk, kalın mürekkep, sert gölge, vuruş ızgarası.
import { clamp, lerp, seg, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import * as ST from './story.js';
const W = 1080, H = 1920, R = Math;
const cv = document.getElementById('c'); const g = cv.getContext('2d');
const INK = '#17141c', WHITE = '#ffffff', CREAM = '#fff4dc';
const K = { yellow: '#FFD23F', yellowL: '#FFE27A', orange: '#FF9F43', orangeL: '#FFB870', pink: '#FF6FA8', pinkL: '#FF93BF', lime: '#9BE15D', limeL: '#B8EC86', sky: '#5EC8FF', skyL: '#8AD8FF', navy: '#25306B', navyL: '#33408A', teal: '#14A3A0', tealL: '#2DBAB6', red: '#FF4D4D', green: '#3DDC84', gold: '#FFC93C', pig: '#6FD68E', pigD: '#4BAE6B' };
const BEAT = ST.BEAT;
const beatPhase = t => (t / BEAT) % 1;

// ——— çizim yardımcıları: önce sert gölge, sonra dolgu + kontur ———
function shp(path, fill, { lw = 8, sh = 10, shCol = INK } = {}) {
  if (sh) { g.save(); g.translate(sh, sh); path(); g.fillStyle = shCol; g.fill(); g.restore(); }
  path(); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); }
}
const rr = (x, y, w, h, r) => () => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const el = (x, y, rx, ry, rot = 0) => () => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
function telop(text, x, y, size, { fill = WHITE, pop = null, rot = 0, align = 'center', t = 0, t0 = 0, rate = .045 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.font = `800 ${size}px Baloo`; g.textBaseline = 'middle';
  const chars = [...text], ws = chars.map(c => g.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? -total / 2 : 0;
  chars.forEach((c, i) => {
    const s = pop ? back(clamp((t - t0 - i * rate) / .16), 2.2) : 1;
    if (s > .01) {
      g.save(); g.translate(cx + ws[i] / 2, 0); g.scale(s, s);
      g.lineJoin = 'round'; g.lineWidth = size * .28; g.strokeStyle = INK; g.strokeText(c, -ws[i] / 2, size * .06);
      g.fillStyle = INK; g.fillText(c, -ws[i] / 2 + size * .05, size * .11);
      g.lineWidth = size * .14; g.strokeText(c, -ws[i] / 2, 0);
      g.fillStyle = fill; g.fillText(c, -ws[i] / 2, 0); g.restore();
    }
    cx += ws[i];
  });
  g.restore();
}
function fitSize(text, size, maxW) { g.font = `800 ${size}px Baloo`; while (g.measureText(text).width > maxW && size > 30) { size -= 2; g.font = `800 ${size}px Baloo`; } return size; }

// ——— setler ———
function setStripes(base, light, t, floor = true) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.save(); g.translate(540, 960); g.rotate(-.45); g.fillStyle = light;
  const off = (t * 60) % 160;
  for (let x = -2200; x < 2200; x += 160) g.fillRect(x + off, -2200, 70, 4400);
  g.restore();
  if (floor) floorBand(base);
}
function setDots(base, light, t) {
  g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = light;
  for (let y = 0; y < H + 120; y += 120) for (let x = ((y / 120) % 2) * 60; x < W + 120; x += 120) { g.beginPath(); g.arc(x, y + (t * 20) % 120, 22, 0, TAU); g.fill(); }
  floorBand(base);
}
function setSun(base, light, t, cx = 540, cy = 860) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.save(); g.translate(cx, cy); g.rotate(t * .25); g.fillStyle = light;
  for (let i = 0; i < 20; i++) { g.rotate(TAU / 20); g.beginPath(); g.moveTo(0, 0); g.lineTo(-180, -2400); g.lineTo(180, -2400); g.closePath(); g.fill(); }
  g.restore();
}
function floorBand(base) {
  g.fillStyle = shade(base, -.22); g.fillRect(0, 1380, W, H - 1380);
  g.fillStyle = INK; g.fillRect(0, 1374, W, 10);
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255; const f = v => R.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255)); return `rgb(${f(r)},${f(gg)},${f(b)})`; }

// ——— maskotlar ———
// adam: fasulye gövde (gök mavisi), turuncu bere, isim yok; o = {eyes, mouth, arms, sq}
function guy(x, y, s, t, o = {}) {
  const hop = o.hop ?? R.abs(R.sin(beatPhase(t) * R.PI)) * 18, sq = o.sq ?? 1;
  g.save(); g.translate(x, y - hop * s); g.scale(s / R.sqrt(sq), s * sq);
  // ayaklar
  const wk = o.walk != null ? R.sin(o.walk * TAU) : 0;
  shp(el(-38 + wk * 34, -6 - R.max(0, wk) * 22, 34, 18), INK, { lw: 0, sh: 0 }); shp(el(38 - wk * 34, -6 - R.max(0, -wk) * 22, 34, 18), INK, { lw: 0, sh: 0 });
  // kollar (arkada)
  const arm = (side, a) => { g.save(); g.translate(side * 92, -170); g.rotate(a * side); shp(rr(-20, -10, 40, 110, 20), K.sky, { lw: 7, sh: 0 }); shp(el(0, 106, 26, 24), WHITE, { lw: 7, sh: 0 }); g.restore(); };
  const A = { walk: [.25 + (o.walk != null ? R.sin(o.walk * TAU) * .5 : 0), .25 - (o.walk != null ? R.sin(o.walk * TAU) * .5 : 0)], think: [.25, -2.4], phone: [.25, -1.1], down: [.25, .25], up: [-2.6, -2.6], tap: [.25, -1.4], hold: [.25, -.9], shock: [-2.2, -2.9] }[o.arms || 'down'];
  arm(-1, A[0]);
  // gövde
  shp(() => { g.beginPath(); g.ellipse(0, -170, 112, 165, 0, 0, TAU); }, K.sky, { sh: 12 });
  shp(el(0, -120, 66, 80), CREAM, { lw: 6, sh: 0 });
  // bere
  shp(() => { g.beginPath(); g.arc(0, -258, 92, R.PI * 1.05, R.PI * 1.95); g.closePath(); }, K.orange, { lw: 7, sh: 0 });
  shp(el(0, -352, 22, 20), K.orange, { lw: 6, sh: 0 });
  // gözler
  const wide = o.eyes === 'wide', happy = o.eyes === 'happy';
  for (const ex of [-38, 38]) {
    if (happy) { g.lineWidth = 9; g.strokeStyle = INK; g.beginPath(); g.arc(ex, -222, 18, R.PI * 1.1, R.PI * 1.9); g.stroke(); continue; }
    shp(el(ex, -222, wide ? 30 : 22, wide ? 36 : 28), WHITE, { lw: 6, sh: 0 });
    shp(el(ex + 3, -218, wide ? 12 : 13, wide ? 14 : 16), INK, { lw: 0, sh: 0 });
    g.fillStyle = WHITE; g.beginPath(); g.arc(ex + 7, -225, 5, 0, TAU); g.fill();
  }
  // ağız
  const m = o.mouth || 'smile';
  if (m === 'open') shp(el(0, -168, 26, 30), INK, { lw: 0, sh: 0 }), shp(el(0, -156, 14, 10), K.red, { lw: 0, sh: 0 });
  else if (m === 'o') shp(el(0, -166, 16, 20), INK, { lw: 0, sh: 0 });
  else { g.lineWidth = 8; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.arc(0, -184, 28, R.PI * .15, R.PI * .85); g.stroke(); }
  if (o.blush) { g.fillStyle = K.pinkL; g.beginPath(); g.ellipse(-70, -180, 18, 10, 0, 0, TAU); g.ellipse(70, -180, 18, 10, 0, 0, TAU); g.fill(); }
  arm(1, A[1]);
  g.restore();
}
// domuzcuk kumbara: s büyüklük
function piggy(x, y, s, t, o = {}) {
  const hop = o.hop ?? R.abs(R.sin(((t / BEAT) + .5) % 1 * R.PI)) * 14, sq = o.sq ?? 1;
  g.save(); g.translate(x, y - hop * s); g.scale(s / R.sqrt(sq), s * sq);
  for (const lx of [-70, -24, 24, 70]) shp(rr(lx - 18, -40, 36, 46, 12), K.pigD, { lw: 7, sh: 0 });
  shp(el(0, -150, 165, 125), K.pig, { sh: 12 });
  // kulaklar
  shp(() => { g.beginPath(); g.moveTo(-95, -240); g.lineTo(-60, -300); g.lineTo(-30, -255); g.closePath(); }, K.pigD, { lw: 7, sh: 0 });
  shp(() => { g.beginPath(); g.moveTo(95, -240); g.lineTo(60, -300); g.lineTo(30, -255); g.closePath(); }, K.pigD, { lw: 7, sh: 0 });
  // para yuvası
  shp(rr(-45, -278, 90, 18, 9), INK, { lw: 0, sh: 0 });
  // kuyruk
  g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.arc(-180, -150, 18, -R.PI * .2, R.PI * 1.3); g.stroke();
  // yüz
  for (const ex of [-55, 30]) { shp(el(ex, -185, 18, 22), WHITE, { lw: 6, sh: 0 }); shp(el(ex + 3, -182, 9, 11), INK, { lw: 0, sh: 0 }); }
  shp(el(-12, -135, 52, 38), K.pigD, { lw: 7, sh: 0 });
  shp(el(-30, -135, 9, 13), INK, { lw: 0, sh: 0 }); shp(el(6, -135, 9, 13), INK, { lw: 0, sh: 0 });
  if (o.happy) { g.lineWidth = 7; g.beginPath(); g.arc(-12, -98, 22, R.PI * .15, R.PI * .85); g.stroke(); }
  g.restore();
}
function coin(x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * R.abs(R.cos(rot * 2)) * .4 + s * .6, s);
  shp(el(0, 0, 44, 44), K.gold, { lw: 7, sh: 6 }); shp(el(0, 0, 30, 30), K.yellowL, { lw: 4, sh: 0 });
  g.font = '800 40px Baloo'; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₺', 0, 3);
  g.restore();
}
function coffee(x, y, s = 1, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 3; i++) { g.lineWidth = 8; g.strokeStyle = WHITE; g.lineCap = 'round'; g.beginPath(); const ox = -24 + i * 24; g.moveTo(ox, -190); g.bezierCurveTo(ox + 18, -215 - R.sin(t * 6 + i) * 6, ox - 18, -240, ox, -265); g.stroke(); }
  shp(() => { g.beginPath(); g.moveTo(-62, -160); g.lineTo(62, -160); g.lineTo(48, 0); g.lineTo(-48, 0); g.closePath(); }, WHITE, { sh: 8 });
  shp(rr(-74, -182, 148, 30, 12), '#6b4a3a', { lw: 7, sh: 0 });
  shp(() => { g.beginPath(); g.moveTo(-58, -110); g.lineTo(58, -110); g.lineTo(53, -50); g.lineTo(-53, -50); g.closePath(); }, '#a8714f', { lw: 6, sh: 0 });
  g.restore();
}
function priceTag(x, y, s, text, rot, color = K.yellow) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(-170, -50); g.lineTo(-230, -110); g.stroke();
  shp(() => { g.beginPath(); g.moveTo(-170, -70); g.lineTo(170, -70); g.lineTo(170, 70); g.lineTo(-170, 70); g.lineTo(-210, 0); g.closePath(); }, color, { sh: 12 });
  shp(el(-165, 0, 12, 12), WHITE, { lw: 5, sh: 0 });
  const fs = fitSize(text, 96, 300); g.font = `800 ${fs}px Baloo`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 12, 6);
  g.restore();
}
function cigPack(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); shp(rr(-60, -170, 120, 170, 12), WHITE); shp(rr(-60, -170, 120, 60, 12), K.red, { lw: 7, sh: 0 }); for (let i = 0; i < 3; i++) shp(rr(-40 + i * 30, -205, 22, 50, 6), CREAM, { lw: 6, sh: 0 }); g.restore(); }
function basket(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 10; g.strokeStyle = INK; g.beginPath(); g.arc(0, -120, 70, R.PI, 0); g.stroke(); shp(() => { g.beginPath(); g.moveTo(-100, -120); g.lineTo(100, -120); g.lineTo(80, 0); g.lineTo(-80, 0); g.closePath(); }, K.orange); for (let i = -1; i <= 1; i++) { g.lineWidth = 6; g.beginPath(); g.moveTo(i * 45, -110); g.lineTo(i * 38, -10); g.stroke(); } shp(el(-30, -140, 28, 22), K.lime, { lw: 6, sh: 0 }); shp(rr(10, -175, 40, 60, 8), K.sky, { lw: 6, sh: 0 }); g.restore(); }
function judge(text, x, y, t, t0, color = K.pink, rot = -.12) {
  const u = back(clamp((t - t0) / .22), 2.6); if (u <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(u, u);
  g.fillStyle = K.yellow; g.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 150 : 230; g.lineTo(R.cos(i / 24 * TAU) * r * 1.4, R.sin(i / 24 * TAU) * r * .7); } g.closePath(); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  telop(text, 0, 0, 120, { fill: color });
  g.restore();
}
function sticker(text, t, t0, color) {
  const u = back(clamp((t - t0) / .2), 2); if (u <= 0) return;
  g.save(); g.translate(60 + 220, 230); g.rotate(-.05); g.scale(u, u);
  shp(rr(-220, -50, 440, 100, 24), color, { sh: 10 });
  const fs = fitSize(text, 52, 400); telop(text, 0, 2, fs);
  g.restore();
}
function plate(text, t, t0) {
  const u = back(clamp((t - t0) / .14), 2);
  const fs = fitSize(text, 58, 900);
  g.font = `800 ${fs}px Baloo`; const tw = g.measureText(text).width;
  g.save(); g.translate(540, 1255); g.scale(u, u);
  shp(rr(-tw / 2 - 40, -fs * .8, tw + 80, fs * 1.6, 30), INK, { lw: 0, sh: 0 });
  telop(text, 0, 2, fs, { fill: K.yellow });
  g.restore();
}
function punch(t) { let z = 1; for (let b = 0; b < ST.DUR / BEAT; b++) { const d = t - b * BEAT; if (d >= 0 && d < .16) z = 1 + .018 * (1 - d / .16) * (b % 4 === 0 ? 1.6 : 1); } return z; }

// ——— sahneler ———
function cafe(x, t) {   // kafe vitrini (dünya x)
  shp(rr(x - 300, 540, 600, 840, 0), K.orangeL, { lw: 8, sh: 0 });
  for (let i = 0; i < 6; i++) shp(() => { g.beginPath(); g.moveTo(x - 320 + i * 107, 720); g.lineTo(x - 320 + (i + 1) * 107, 720); g.lineTo(x - 320 + (i + .5) * 107, 800); g.closePath(); }, i % 2 ? WHITE : K.pink, { lw: 6, sh: 0 });
  shp(rr(x - 320, 660, 640, 70, 10), K.pink, { lw: 7, sh: 0 });
  shp(rr(x - 230, 560, 460, 90, 24), INK, { lw: 0, sh: 8 }); telop('KAHVE', x, 606, 70, { fill: K.yellow });
  shp(rr(x - 250, 850, 300, 280, 14), K.skyL, { lw: 8, sh: 0 });
  coffee(x - 100, 1095, .7, t);
  shp(rr(x + 90, 850, 170, 530, 14), shade(K.orange, -.25), { lw: 8, sh: 0 }); shp(el(x + 230, 1060, 12, 12), K.yellow, { lw: 5, sh: 0 });
  // kapı önünde küçük menü panosu (fiyat buradan okunur)
  shp(rr(x - 210, 1150, 200, 230, 12), INK, { lw: 0, sh: 8 }); telop('LATTE', x - 110, 1215, 40, { fill: CREAM }); telop('120 TL', x - 110, 1290, 48, { fill: K.yellow });
}
function shop(x, col, name) { shp(rr(x - 280, 520, 560, 860, 0), col, { lw: 8, sh: 0 }); shp(rr(x - 200, 760, 400, 320, 14), K.skyL, { lw: 8, sh: 0 }); shp(rr(x - 210, 600, 420, 90, 20), WHITE, { lw: 7, sh: 0 }); g.font = '800 54px Baloo'; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, x, 648); }
function bubble(text, x, y, t, t0, { size = 64, think = true } = {}) {
  const u = back(clamp((t - t0) / .22), 2.2); if (u <= 0) return;
  g.save(); g.translate(x, y); g.scale(u, u);
  const fs = fitSize(text, size, 620); g.font = `800 ${fs}px Baloo`; const tw = g.measureText(text).width;
  if (think) { shp(el(-tw / 2 + 20, 120, 26, 22), WHITE, { sh: 6 }); shp(el(-tw / 2 - 10, 170, 16, 14), WHITE, { sh: 5 }); }
  shp(rr(-tw / 2 - 50, -70, tw + 100, 140, 70), WHITE, { sh: 10 });
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6);
  g.restore();
}
function sceneStreet(t) {
  g.fillStyle = K.sky; g.fillRect(0, 0, W, H);
  for (const [cx, cy, r] of [[120, 520, 60], [190, 500, 80], [890, 560, 70], [960, 540, 55]]) shp(el(cx, cy, r, r * .7), WHITE, { lw: 0, sh: 0 });
  const walkU = clamp(t / ST.STOP), camX = lerp(-700, 0, eo(walkU));
  g.save(); g.translate(-camX, 0);
  shop(-900, K.yellow, 'BÜFE'); shop(-300, K.lime, 'MANAV');
  cafe(600, t);
  g.restore();
  g.fillStyle = shade(K.sky, -.35); g.fillRect(0, 1380, W, H - 1380); g.fillStyle = INK; g.fillRect(0, 1374, W, 10);
  for (let x = -((-camX * 1) % 200); x < W; x += 200) { g.fillStyle = shade(K.sky, -.25); g.fillRect(x, 1500, 120, 18); }
  const walking = t < ST.STOP;
  guy(250, 1385, 1.0, t, { arms: walking ? 'walk' : 'think', walk: walking ? t * 1.8 : null, hop: walking ? R.abs(R.sin(t * 1.8 * TAU)) * 10 : 0, eyes: 'open', mouth: t > .4 && t < 1.9 ? (R.floor(t * 8) % 2 ? 'o' : 'smile') : 'smile' });
  bubble('Bir kahve alsam mı?', 560, 780, t, .45);
  telop('SEN OLSAN', 540, 250, 96, { pop: true, t, t0: .1, fill: WHITE }); telop('ALIR MIYDIN?', 540, 370, 96, { pop: true, t, t0: .3, fill: K.yellow });
}
function sceneBoard(t) {
  const d = t - ST.BOARD;
  setDots(K.orange, K.orangeL, t);
  const z = 1 + .04 * R.exp(-d * 6);
  g.save(); g.translate(560, 640); g.scale(z, z); g.rotate(-.04);
  shp(rr(-360, -300, 720, 560, 30), INK, { lw: 0, sh: 16 });
  shp(rr(-340, -280, 680, 520, 22), '#2b2a33', { lw: 6, sh: 0 });
  telop('MENÜ', 0, -200, 80, { fill: CREAM });
  g.font = '800 54px Baloo'; g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('Çay', -280, -90); g.fillText('Latte', -280, 20); g.fillText('Kurabiye', -280, 130);
  g.textAlign = 'right'; g.fillText('25 TL', 280, -90); g.fillText('60 TL', 280, 130);
  const ring = back(clamp((d - .3) / .25), 2.5);
  g.save(); g.translate(180, 20); g.scale(ring || .01, ring || .01); g.lineWidth = 10; g.strokeStyle = K.yellow; g.beginPath(); g.ellipse(0, 0, 150, 62, -.05, 0, TAU); g.stroke(); g.restore();
  telop('120 TL', 180, 20, 74, { fill: K.yellow });
  g.restore();
  const shocked = d > .4;
  guy(240, 1385, 1.15, t, { arms: shocked ? 'shock' : 'think', eyes: shocked ? 'wide' : 'open', mouth: shocked ? 'open' : 'smile', hop: 0, sq: shocked ? 1 + .07 * R.sin(d * 30) * R.exp(-(d - .4) * 5) : 1 });
  bubble('120 TL mi?!', 700, 1080, t, ST.BOARD + .42, { size: 80, think: false });
}
function gear(x, y, r, rot, col) { g.save(); g.translate(x, y); g.rotate(rot); shp(() => { g.beginPath(); const n = 10; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr_ = i % 2 ? r : r * 1.22; g.lineTo(R.cos(a - .12) * rr_, R.sin(a - .12) * rr_); g.lineTo(R.cos(a + .12) * rr_, R.sin(a + .12) * rr_); } g.closePath(); }, col, { sh: 8 }); shp(el(0, 0, r * .35, r * .35), INK, { lw: 0, sh: 0 }); g.restore(); }
function headphones(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 16; g.strokeStyle = INK; g.beginPath(); g.arc(0, 0, 60, R.PI, 0); g.stroke(); g.lineWidth = 9; g.strokeStyle = WHITE; g.beginPath(); g.arc(0, 0, 60, R.PI * 1.02, -R.PI * .02); g.stroke(); shp(rr(-82, -6, 40, 70, 16), K.sky, { lw: 7, sh: 4 }); shp(rr(42, -6, 40, 70, 16), K.sky, { lw: 7, sh: 4 }); g.restore(); }
function sceneHead(t) {
  const d = t - ST.HEAD;
  setStripes(K.navy, K.navyL, t, false);
  gear(150, 1560, 120, t * 2.4, K.yellow); gear(330, 1700, 75, -t * 3.8, K.pink); gear(930, 1540, 130, -t * 2, K.lime); gear(760, 1690, 80, t * 3.2, K.orange);
  telop('KAFADAN HESAP', 540, 250, 84, { pop: true, t, t0: ST.HEAD + .1, fill: WHITE });
  ST.MATH.forEach(([t0, a, b], i) => {
    const u = back(clamp((t - t0) / .2), 2.4); if (u <= 0) return;
    const y = 430 + i * 215, big = i === 2;
    g.save(); g.translate(540, y); g.scale(u, u); g.rotate((i - 1) * .025);
    shp(rr(-430, -90, 860, 180, 40), big ? K.pink : CREAM, { sh: 12 });
    g.font = '800 52px Baloo'; g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(a, -390, 4);
    telop(b, 140, 2, big ? 104 : 88, { fill: big ? K.yellow : WHITE });
    g.restore();
  });
  // ≈ 5 kulaklık
  const k = back(clamp((t - ST.KULAK) / .2), 2.2);
  if (k > 0) {
    g.save(); g.translate(540, 1080); g.scale(k, k); shp(rr(-460, -95, 920, 190, 46), K.yellow, { sh: 12 }); g.restore();
    for (let i = 0; i < 5; i++) { const s = back(clamp((t - ST.KULAK - .1 - i * .12) / .16), 2.4); if (s > 0) headphones(-330 + 540 + i * 165, 1075, .8 * s); }
    telop('≈ 5 KULAKLIK!', 540, 1250, 92, { pop: true, t, t0: ST.KULAK + .7, fill: WHITE });
  }
  // kafaya giriş: daire şeklinde açılış
  if (d < .35) { const r = 40 + eo(d / .35) * 1500; g.save(); g.fillStyle = K.orange; g.beginPath(); g.rect(0, 0, W, H); g.arc(240, 1100, r, 0, TAU, true); g.fill('evenodd'); g.restore(); }
}
function sceneTap(t) {
  setDots(K.pink, K.pinkL, t);
  sticker('KARAR ANI', t, ST.R2, K.navy);
  const d = t - ST.TAP;
  guy(260, 1385, 1.0, t, { arms: d > -.1 && d < .5 ? 'tap' : d >= .5 ? 'up' : 'down', eyes: d > .5 ? 'happy' : 'open', mouth: d > -.05 && d < 1 ? 'open' : 'smile', blush: d > .5 });
  // kahve kenara itilir
  // büyük yeşil düğme (uygulamadaki gibi)
  const press = d > 0 && d < .18 ? 12 : 0;
  g.save(); g.translate(540, 760 + press);
  shp(rr(-380, -95, 760, 190, 95), K.green, { sh: press ? 2 : 14 });
  telop('✋ VAZGEÇTİM!', 0, 4, 92, { fill: WHITE });
  g.restore();
  piggy(800, 1390, .95, t, { happy: d > 1.1 });
  // para domuzcuğa uçar
  const cu = seg(t, ST.TAP + .3, ST.TAP + .95);
  if (cu > 0 && cu < 1) { const x = lerp(540, 790, cu), y = lerp(860, 1090, cu) - R.sin(cu * R.PI) * 380; coin(x, y, 1.2, cu * 9); }
  judge('SÜPER!', 560, 520, t, ST.TAP + 1.0, K.pink, -.1);
}
function sceneRun(t) {
  setStripes(K.sky, K.skyL, t);
  sticker('3. TUR: BİRİKTİR', t, ST.R3, K.teal);
  let n = 0; ST.ITEMS.forEach((ti, i) => { if (t >= ti + .45) n = i + 1; });
  const total = n >= 3 ? ST.COUNT[4] : ST.COUNT[n + 1 > 3 ? 4 : n];
  const grow = 1 + n * .12;
  // sayaç
  const shown = n === 3 ? R.round(lerp(ST.COUNT[3], ST.COUNT[4], eo(seg(t, ST.ITEMS[2] + .45, ST.ITEMS[2] + .9)))) : ST.COUNT[n];
  g.save(); g.translate(540, 470); shp(rr(-330, -85, 660, 170, 40), INK, { sh: 0, lw: 0 }); telop(shown.toLocaleString('tr-TR') + ' TL', 0, 4, 120, { fill: K.green }); g.restore();
  piggy(560, 1390, .9 * grow, t, { happy: n > 0, sq: 1 + .08 * R.exp(-((t - (ST.ITEMS[R.max(0, n - 1)] + .45)) * 8)) * R.sin((t - (ST.ITEMS[R.max(0, n - 1)] + .45)) * 30) });
  // düşen nesneler → paraya dönüşür
  const draws = [(x, y, s) => coffee(x, y, s * .8, t), (x, y, s) => cigPack(x, y, s), (x, y, s) => basket(x, y, s * .9)];
  ST.ITEMS.forEach((ti, i) => {
    const d = t - ti; if (d < 0 || d > .9) return;
    const x = [260, 840, 300][i];
    if (d < .3) draws[i](x, lerp(300, 850, ei(d / .3)), 1);
    else { const u = (d - .3) / .45; if (u < 1) coin(lerp(x, 560, u), lerp(800, 1040 * 1, u) - R.sin(u * R.PI) * 260, 1.2, u * 10); }
    if (d > .28 && d < .42) { g.save(); g.translate(x, 820); const s = (d - .28) / .14; g.scale(1 + s, 1 + s); g.globalAlpha = 1 - s; g.lineWidth = 8; g.strokeStyle = INK; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.moveTo(R.cos(a) * 60, R.sin(a) * 60); g.lineTo(R.cos(a) * 110, R.sin(a) * 110); g.stroke(); } g.restore(); }
  });
  judge('BİRİKİYOR!', 540, 760, t, ST.ITEMS[2] + 1.0, K.yellow, .1);
}
const IMG = {};
function loadImg(k, src) { return new Promise(r => { const im = new Image(); im.onload = () => { IMG[k] = im; r(); }; im.src = src; }); }
const REC = {};
function recImg(set, i, n) { i = clamp(R.round(i), 1, n); return REC[set + i]; }
function scenePhone(t) {
  setSun(K.navy, K.navyL, t, 540, 960);
  const push = back(seg(t, ST.R4, ST.R4 + .35), 1.5);
  // kaynak: kayıt kareleri (640 genişlik, durum çubuğu kırpılmış) ya da ekran görüntüsü
  let im, crop = 0, k = 1;
  if (t < ST.GOAL) im = recImg('a', lerp(1, 257, seg(t, ST.R4, ST.GOAL - .05)), 257);
  else if (t < ST.SMOKE) { im = IMG.hedefler; crop = 150; k = 640 / im.width; }
  else im = recImg('b', lerp(1, 88, seg(t, ST.SMOKE, ST.R5)), 88);
  const sw = 640, sh = 1304 * .86;
  const sc = lerp(.6, 1, push);
  g.save(); g.translate(540, 180 + (sh + 60) / 2 + 20); g.scale(sc, sc);
  shp(rr(-sw / 2 - 30, -sh / 2 - 30, sw + 60, sh + 60, 80), '#1d1d24', { sh: 16 });
  g.save(); g.beginPath(); g.roundRect(-sw / 2, -sh / 2, sw, sh, 56); g.clip();
  g.fillStyle = '#0b100d'; g.fillRect(-sw / 2, -sh / 2, sw, sh);
  const sw0 = (t >= ST.GOAL && t < ST.GOAL + .2) || (t >= ST.SMOKE && t < ST.SMOKE + .2);
  const sl = sw0 ? (1 - eo(((t - (t < ST.SMOKE ? ST.GOAL : ST.SMOKE)) / .2))) * sw : 0;
  g.drawImage(im, 0, crop, im.width, im.height - crop, -sw / 2 + sl, -sh / 2, sw, (im.height - crop) * k);
  // vurgular (ekran koordinatı: 640 genişlik)
  const env = (a, b) => R.max(0, R.min(seg(t, a, a + .2), 1 - seg(t, b - .15, b)));
  const box = (x, y, w, h, a, col = K.yellow) => { if (a <= 0) return; g.globalAlpha = a; g.lineWidth = 9; g.strokeStyle = col; g.beginPath(); g.roundRect(-sw / 2 + x + sl, -sh / 2 + y, w, h, 30); g.stroke(); g.globalAlpha = 1; };
  const ripple = (x, y, t0) => { const u = (t - t0) / .45; if (u < 0 || u > 1) return; g.globalAlpha = .8 * (1 - u); g.fillStyle = WHITE; g.beginPath(); g.arc(-sw / 2 + x, -sh / 2 + y, 30 + u * 110, 0, TAU); g.fill(); g.globalAlpha = 1; };
  ripple(320, 548, ST.R4 + .25);                                  // Vazgeçtim!
  box(18, 70, 604, 170, env(ST.GOAL - 1.05, ST.GOAL));               // +120 TL kumbarada · 4.077 TL
  if (t >= ST.GOAL && t < ST.SMOKE) box(32, (500 - 150) * k, 576, 420 * k, env(ST.GOAL + .15, ST.SMOKE));
  box(18, 140, 604, 200, env(ST.SMOKE + .25, ST.R5));       // işleyen sigarasız sayaç
  g.restore();
  g.fillStyle = INK; g.beginPath(); g.roundRect(-70, -sh / 2 + 18, 140, 36, 18); g.fill();
  g.restore();
}
function sceneEnd(t) {
  setSun(K.pink, K.pinkL, t, 540, 760);
  const d = t - ST.R5;
  telop('VAZGEÇME', 540, 250, 140, { pop: true, t, t0: ST.R5 + .1, fill: WHITE });
  telop('KUMBARAM', 540, 395, 140, { pop: true, t, t0: ST.R5 + .4, fill: K.yellow });
  const u = back(seg(d, .05, .45), 2);
  if (u > 0) { g.save(); g.translate(540, 740); g.scale(u, u); g.rotate(R.sin(t * 3) * .03);
    shp(rr(-200, -200, 400, 400, 92), INK, { lw: 0, sh: 16 }); g.drawImage(IMG.logo, -196, -196, 392, 392);
    g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.roundRect(-200, -200, 400, 400, 92); g.stroke(); g.restore(); }
  coin(230, 640 + R.sin(t * 5) * 20, 1.1, t * 3); coin(860, 560 + R.cos(t * 5) * 20, 1.0, t * 3 + 1); coin(880, 900 + R.sin(t * 4 + 1) * 16, .8, t * 3 + 2);
  const a = back(seg(d, .9, 1.2), 2);
  if (a > 0) { g.save(); g.translate(540, 1050); g.rotate(-.03); g.scale(a, a); shp(rr(-430, -55, 860, 110, 30), CREAM, { sh: 10 }); const fs = fitSize('Küçük vazgeçişler, büyük birikim.', 52, 800); g.font = `800 ${fs}px Baloo`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Küçük vazgeçişler, büyük birikim.', 0, 4); g.restore(); }
  const b = back(seg(d, 1.3, 1.6), 2);
  if (b > 0) { const p = 1 + .04 * R.max(0, R.sin(d * R.PI * 4)); g.save(); g.translate(540, 1215); g.scale(b * p, b * p); shp(rr(-330, -65, 660, 130, 65), K.green, { sh: 12 }); telop("App Store'da İndir", 0, 4, 64, { fill: WHITE }); g.restore(); }
  piggy(540, 1720, .75, t, { happy: true });
}

// ——— ana çizim ———
await document.fonts.ready;
await document.fonts.load('800 80px Baloo', 'şğİıçöüŞĞÇÖÜ₺');
await Promise.all([loadImg('hedefler', 'img/hedefler.png'), loadImg('logo', 'img/logo.png')]);
const ld = (set, i) => new Promise(r => { const im = new Image(); im.onload = () => { REC[set + i] = im; r(); }; im.src = `rec/${set}/${String(i).padStart(4, '0')}.jpg`; });
const jobs = []; for (let i = 1; i <= 257; i++) jobs.push(ld('a', i)); for (let i = 1; i <= 88; i++) jobs.push(ld('b', i)); await Promise.all(jobs);
const CUTS = [ST.BOARD, ST.DEC, ST.R4, ST.R5];
function draw(t) {
  t = Math.min(t, ST.DUR - 1e-4);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const z = punch(t); g.translate(540, 960); g.scale(z, z); g.translate(-540, -960);
  if (t < ST.BOARD) sceneStreet(t); else if (t < ST.HEAD) sceneBoard(t); else if (t < ST.DEC) sceneHead(t); else if (t < ST.R4) sceneTap(t); else if (t < ST.R5) scenePhone(t); else sceneEnd(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const s = ST.SUBS.find(s => t >= s[0] && t < s[1]); if (s) plate(s[2], t, s[0]);
  // kesmelerde kısa beyaz flaş
  for (const c of CUTS) { const d = t - c; if (d >= 0 && d < .08) { g.fillStyle = `rgba(255,255,255,${.7 * (1 - d / .08)})`; g.fillRect(0, 0, W, H); } }
}
window.DUR = ST.DUR;
window.SUBS = ST.SUBS.map(s => ({ t0: s[0], t1: s[1], text: s[2] }));
window.render = t => draw(t);
draw(0);
window.READY = true;
