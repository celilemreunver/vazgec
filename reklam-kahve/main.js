// main.js — "Vazgeçme Kumbaram: Kahve" (1080×1920, 24 fps). Lemo-Opuscar game-show stil kurallarıyla: düz renk, kalın mürekkep, sert gölge, vuruş ızgarası.
import { clamp, lerp, seg, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import * as ST from './story.js';
const W = 1080, H = 1920, R = Math;
const cv = document.getElementById('c'); const g = cv.getContext('2d');
const INK = '#17141c', WHITE = '#ffffff', CREAM = '#fff4dc';
const K = { yellow: '#FFD23F', yellowL: '#FFE27A', orange: '#FF9F43', orangeL: '#FFB870', pink: '#FF6FA8', pinkL: '#FF93BF', lime: '#9BE15D', limeL: '#B8EC86', sky: '#5EC8FF', skyL: '#8AD8FF', navy: '#25306B', navyL: '#33408A', teal: '#14A3A0', tealL: '#2DBAB6', red: '#FF4D4D', green: '#3DDC84', gold: '#FFC93C', pig: '#FF8FB5', pigD: '#F06A9A' };
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
  shp(el(-38, -6, 34, 18), INK, { lw: 0, sh: 0 }); shp(el(38, -6, 34, 18), INK, { lw: 0, sh: 0 });
  // kollar (arkada)
  const arm = (side, a) => { g.save(); g.translate(side * 92, -170); g.rotate(a * side); shp(rr(-20, -10, 40, 110, 20), K.sky, { lw: 7, sh: 0 }); shp(el(0, 106, 26, 24), WHITE, { lw: 7, sh: 0 }); g.restore(); };
  const A = { down: [.25, .25], up: [-2.6, -2.6], tap: [.25, -1.4], hold: [.25, -.9], shock: [-2.2, -2.9] }[o.arms || 'down'];
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
function sceneHook(t) {
  setSun(K.yellow, K.yellowL, t);
  floorBand(K.yellow);
  guy(330, 1385, 1.05, t, { arms: 'hold', mouth: t > .6 && t < 2.6 ? (R.floor(t * 8) % 2 ? 'open' : 'smile') : 'smile' });
  coffee(560, 1220, 1.1, t);
  priceTag(780, 820, 1, '120 TL', -.12 + R.sin(t * 4) * .06);
  telop('BU KAHVE', 540, 270, 130, { pop: true, t, t0: .05 });
  telop('KAÇA MAL OLUYOR?', 540, 410, 100, { fill: K.yellow, pop: true, t, t0: .35 });
}
function sceneMath(t) {
  setStripes(K.orange, K.orangeL, t);
  sticker('1. TUR: KAHVE', t, ST.R1, K.red);
  const d = t - ST.R1;
  const shocked = d > 1.5;
  guy(250, 1385, 1.0, t, { arms: shocked ? 'shock' : 'hold', eyes: shocked ? 'wide' : 'open', mouth: shocked ? 'open' : 'smile', sq: shocked ? 1 + .06 * R.sin(d * 30) * R.exp(-(d - 1.5) * 6) : 1 });
  coffee(500, 1270, .8, t);
  // dönen etiket: 120 TL → × 365 GÜN → 43.800 TL
  const steps = [[0, '120 TL', K.yellow], [.5, '× 365 GÜN', WHITE], [1.5, '43.800 TL', K.pink]];
  let cur = steps[0]; for (const s of steps) if (d >= s[0]) cur = s;
  const flip = clamp((d - cur[0]) / .18);
  g.save(); g.translate(560, 760); g.scale(1, .2 + .8 * eo(flip)); g.translate(-560, -760);
  priceTag(590, 760, cur[1] === '43.800 TL' ? 1.35 : 1.1, cur[1], -.06, cur[2]);
  g.restore();
  if (d > 1.5) telop('/ YIL', 760, 930, 90, { pop: true, t, t0: ST.R1 + 1.55, fill: WHITE });
  judge('ŞOK!', 760, 1120, t, ST.R1 + 2.0, K.yellow, .14);
}
function sceneTap(t) {
  setDots(K.pink, K.pinkL, t);
  sticker('2. TUR: VAZGEÇ', t, ST.R2, K.navy);
  const d = t - ST.TAP;
  guy(260, 1385, 1.0, t, { arms: d > -.1 && d < .5 ? 'tap' : d >= .5 ? 'up' : 'down', eyes: d > .5 ? 'happy' : 'open', mouth: d > -.05 && d < 1 ? 'open' : 'smile', blush: d > .5 });
  // kahve kenara itilir
  coffee(lerp(520, 1250, ei(seg(t, ST.R2, ST.R2 + .4))), 1290, .75, t);
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
  setStripes(K.lime, K.limeL, t);
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
function scenePhone(t) {
  setSun(K.navy, K.navyL, t, 540, 960);
  const push = back(seg(t, ST.R4, ST.R4 + .35), 1.5);
  const key = t < ST.GOAL ? 'kumbara' : t < ST.SMOKE ? 'hedefler' : 'sigarasiz';
  const im = IMG[key], crop = 150, sw = 640, k = sw / im.width, sh = (im.height - crop) * k * .86;
  const sc = lerp(.6, 1, push);
  g.save(); g.translate(540, 180 + (sh + 60) / 2 + 20); g.scale(sc, sc);
  shp(rr(-sw / 2 - 30, -sh / 2 - 30, sw + 60, sh + 60, 80), '#1d1d24', { sh: 16 });
  g.save(); g.beginPath(); g.roundRect(-sw / 2, -sh / 2, sw, sh, 56); g.clip();
  // ekran geçişlerinde hızlı kaydırma
  const sw0 = (t >= ST.GOAL && t < ST.GOAL + .2) || (t >= ST.SMOKE && t < ST.SMOKE + .2);
  const sl = sw0 ? (1 - eo(((t - (t < ST.SMOKE ? ST.GOAL : ST.SMOKE)) / .2))) * sw : 0;
  g.drawImage(im, 0, crop, im.width, im.height - crop, -sw / 2 + sl, -sh / 2, sw, (im.height - crop) * k);
  // vurgular (kaynak piksel koordinatları, crop sonrası)
  const box = (x, y, w, h, a, col = K.yellow) => { if (a <= 0) return; g.globalAlpha = a; g.lineWidth = 9; g.strokeStyle = col; g.beginPath(); g.roundRect(-sw / 2 + x * k + sl, -sh / 2 + (y - crop) * k, w * k, h * k, 30); g.stroke(); g.globalAlpha = 1; };
  const env = (a, b) => R.max(0, R.min(seg(t, a, a + .2), 1 - seg(t, b - .15, b)));
  if (key === 'kumbara') {
    box(70, 380, 1040, 360, env(12.4, 13.6));            // 3.956 TL
    box(60, 1060, 1060, 200, env(13.6, 15.2));           // Vazgeçtim!
    box(60, 1290, 1060, 210, env(15.2, 16.6));           // sigarasız satırı
    if (t > 14.0 && t < 14.6) { const u = (t - 14.0) / .6; g.globalAlpha = 1 - u; g.fillStyle = WHITE; g.beginPath(); g.arc(-sw / 2 + 590 * k, -sh / 2 + (1160 - crop) * k, 40 + u * 160, 0, TAU); g.fill(); g.globalAlpha = 1; }
  }
  if (key === 'hedefler') box(60, 500, 1060, 420, env(ST.GOAL + .15, ST.SMOKE));
  if (key === 'sigarasiz') { box(60, 340, 1060, 420, env(ST.SMOKE + .2, 19.2)); box(600, 790, 520, 320, env(19.2, ST.R5)); }
  g.restore();
  g.fillStyle = INK; g.beginPath(); g.roundRect(-70, -sh / 2 + 18, 140, 36, 18); g.fill();
  g.restore();
}
function sceneEnd(t) {
  setSun(K.teal, K.tealL, t, 540, 820);
  const d = t - ST.R5;
  piggy(540, 1150, back(seg(d, 0, .4), 2) * 1.55, t, { happy: true });
  coin(300, 520 + R.sin(t * 5) * 20, 1.1, t * 3); coin(800, 460 + R.cos(t * 5) * 20, 1.0, t * 3 + 1);
  telop('VAZGEÇME', 540, 270, 140, { pop: true, t, t0: ST.R5 + .1, fill: WHITE });
  telop('KUMBARAM', 540, 420, 140, { pop: true, t, t0: ST.R5 + .4, fill: K.yellow });
  const a = back(seg(d, .9, 1.2), 2);
  if (a > 0) { g.save(); g.translate(540, 1255); g.rotate(-.03); g.scale(a, a); shp(rr(-430, -55, 860, 110, 30), CREAM, { sh: 10 }); const fs = fitSize('Küçük vazgeçişler, büyük birikim.', 52, 800); g.font = `800 ${fs}px Baloo`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Küçük vazgeçişler, büyük birikim.', 0, 4); g.restore(); }
  const b = back(seg(d, 1.3, 1.6), 2);
  if (b > 0) { const p = 1 + .04 * R.max(0, R.sin(d * R.PI * 4)); g.save(); g.translate(540, 1420); g.scale(b * p, b * p); shp(rr(-330, -65, 660, 130, 65), K.green, { sh: 12 }); telop("App Store'da İndir", 0, 4, 64, { fill: WHITE }); g.restore(); }
}

// ——— ana çizim ———
await document.fonts.ready;
await document.fonts.load('800 80px Baloo', 'şğİıçöüŞĞÇÖÜ₺');
await Promise.all([loadImg('kumbara', 'img/kumbara.png'), loadImg('hedefler', 'img/hedefler.png'), loadImg('sigarasiz', 'img/sigarasiz.png')]);
const CUTS = [ST.R1, ST.R2, ST.R3, ST.R4, ST.R5];
function draw(t) {
  t = Math.min(t, ST.DUR - 1e-4);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const z = punch(t); g.translate(540, 960); g.scale(z, z); g.translate(-540, -960);
  if (t < ST.R1) sceneHook(t); else if (t < ST.R2) sceneMath(t); else if (t < ST.R3) sceneTap(t); else if (t < ST.R4) sceneRun(t); else if (t < ST.R5) scenePhone(t); else sceneEnd(t);
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
