/* Motor de los anuncios de AniRadar (1080×1920): utilidades de dibujo, iconos, marca, mascota Radi, tipografía cinética,
   móvil, fondos, registro de escenas/efectos y composición con transiciones. Cada página define sus escenas y llama a finalize(). */
const W = 1080, H = 1920, C = document.getElementById('c'), X = C.getContext('2d');
const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; const O = OFF.getContext('2d');
const INK = '#14162B', MUT = '#6B6F86', ACC = '#FF5500', ACC2 = '#FF8A3D', OK = '#16A34A', OKBG = 'rgba(22,163,74,.12)', MONO = '"DejaVu Sans Mono", monospace';

const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const P = (t, a, b) => cl((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eb = (x) => { const c1 = 1.70158, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
let K = X; // contexto activo (cada escena se dibuja en el lienzo auxiliar y luego se compone con zoom/desenfoque)

/* ---------- utilidades de dibujo ---------- */
function font(size, w = 800, fam = 'Inter') { K.font = `${w} ${size}px ${fam}`; }
function txt(s, x, y, o = {}) {
  K.save(); K.globalAlpha *= (o.a ?? 1); font(o.size || 60, o.w || 800, o.fam || 'Inter');
  K.fillStyle = o.c || INK; K.textAlign = o.align || 'left'; K.textBaseline = 'alphabetic'; K.fillText(s, x, y); K.restore();
}
function wrap(s, maxW, size, w = 800) {
  font(size, w); const out = []; let l = '';
  s.split(' ').forEach((wd) => { const t = l ? l + ' ' + wd : wd; if (K.measureText(t).width > maxW && l) { out.push(l); l = wd; } else l = t; });
  if (l) out.push(l); return out;
}
function rr(x, y, w, h, r, fill, stroke, lw = 2) {
  K.beginPath(); K.roundRect(x, y, w, h, r);
  if (fill) { K.fillStyle = fill; K.fill(); }
  if (stroke) { K.lineWidth = lw; K.strokeStyle = stroke; K.stroke(); }
}
function card(x, y, w, h, r = 40, fill = '#fff') {
  K.save(); K.shadowColor = 'rgba(20,22,43,.16)'; K.shadowBlur = 60; K.shadowOffsetY = 22; rr(x, y, w, h, r, fill); K.restore();
  rr(x, y, w, h, r, null, 'rgba(20,22,43,.06)', 2);
}
function pop(cx, cy, p, fn) { // aparece desde el centro con rebote y desenfoque
  if (p <= 0) return; const s = 0.85 + 0.15 * eb(p);
  K.save(); K.globalAlpha *= cl(p * 2); K.translate(cx, cy); K.scale(s, s); K.translate(-cx, -cy);
  if (p < 1) K.filter = `blur(${(1 - eo(p)) * 10}px)`; fn(); K.restore();
}
function rise(p, fn, dy = 70) { // sube desde abajo con desenfoque
  if (p <= 0) return; const e = eo(p);
  K.save(); K.globalAlpha *= cl(p * 1.8); K.translate(0, (1 - e) * dy); if (p < 1) K.filter = `blur(${(1 - e) * 12}px)`; fn(); K.restore();
}
let SEED = 1; const rnd = () => ((SEED = (SEED * 16807) % 2147483647) / 2147483647);

/* ---------- iconos ---------- */
function iSearch(x, y, s, c = ACC) { K.save(); K.strokeStyle = c; K.lineWidth = s * 0.16; K.lineCap = 'round'; K.beginPath(); K.arc(x - s * 0.1, y - s * 0.1, s * 0.3, 0, 7); K.stroke(); K.beginPath(); K.moveTo(x + s * 0.12, y + s * 0.12); K.lineTo(x + s * 0.38, y + s * 0.38); K.stroke(); K.restore(); }
function iCamera(x, y, s, c = ACC) { K.save(); rr(x - s * 0.45, y - s * 0.28, s * 0.9, s * 0.62, s * 0.14, c); rr(x - s * 0.18, y - s * 0.42, s * 0.36, s * 0.18, s * 0.06, c); K.fillStyle = '#fff'; K.beginPath(); K.arc(x, y + s * 0.03, s * 0.18, 0, 7); K.fill(); K.fillStyle = c; K.beginPath(); K.arc(x, y + s * 0.03, s * 0.1, 0, 7); K.fill(); K.restore(); }
function iGlobe(x, y, s, c = ACC) { K.save(); K.strokeStyle = c; K.lineWidth = s * 0.1; K.beginPath(); K.arc(x, y, s * 0.4, 0, 7); K.stroke(); K.beginPath(); K.ellipse(x, y, s * 0.17, s * 0.4, 0, 0, 7); K.stroke(); K.beginPath(); K.moveTo(x - s * 0.4, y); K.lineTo(x + s * 0.4, y); K.stroke(); K.restore(); }
function iSpark(x, y, s, c = ACC) { K.save(); K.fillStyle = c; K.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.16 : s * 0.5, a = i * Math.PI / 4 - Math.PI / 2; K.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } K.closePath(); K.fill(); K.restore(); }
function iCheck(x, y, s, c = '#fff', lw) { K.save(); K.strokeStyle = c; K.lineWidth = lw || s * 0.18; K.lineCap = 'round'; K.lineJoin = 'round'; K.beginPath(); K.moveTo(x - s * 0.42, y); K.lineTo(x - s * 0.12, y + s * 0.3); K.lineTo(x + s * 0.45, y - s * 0.32); K.stroke(); K.restore(); }
function iBell(cx, cy, s, a = 0, c = ACC) {
  K.save(); K.translate(cx, cy - s * 0.5); K.rotate(a); K.translate(0, s * 0.5); K.fillStyle = c;
  K.beginPath(); K.moveTo(-s * 0.42, s * 0.28); K.quadraticCurveTo(-s * 0.38, -s * 0.45, 0, -s * 0.48); K.quadraticCurveTo(s * 0.38, -s * 0.45, s * 0.42, s * 0.28); K.lineTo(s * 0.52, s * 0.4); K.lineTo(-s * 0.52, s * 0.4); K.closePath(); K.fill();
  K.beginPath(); K.arc(0, s * 0.52, s * 0.13, 0, 7); K.fill(); K.restore();
}
function okBadge(x, y, s) { K.save(); K.fillStyle = OK; K.beginPath(); K.arc(x, y, s / 2, 0, 7); K.fill(); iCheck(x, y + s * 0.02, s * 0.55, '#fff', s * 0.11); K.restore(); }

/* ---------- marca: icono, radar y mascota ---------- */
function radarMarks(r, t, col = '#fff') {
  const g = K.createConicGradient(t * 2.6, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.26, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  K.fillStyle = g; K.beginPath(); K.arc(0, 0, r, 0, 7); K.fill();
  K.strokeStyle = col; K.globalAlpha *= 0.95; K.lineWidth = r * 0.09; K.beginPath(); K.arc(0, 0, r, 0, 7); K.stroke();
  K.lineWidth = r * 0.05; K.setLineDash([r * 0.16, r * 0.14]); K.beginPath(); K.arc(0, 0, r * 0.58, 0, 7); K.stroke(); K.setLineDash([]);
  K.fillStyle = col; K.beginPath(); K.arc(0, 0, r * 0.16, 0, 7); K.fill();
  K.fillStyle = '#34D399'; K.beginPath(); K.arc(r * 0.46, -r * 0.5, r * 0.12, 0, 7); K.fill();
}
function appIcon(cx, cy, s, t, ring) {
  K.save(); K.translate(cx, cy);
  K.save(); K.shadowColor = ring ? 'rgba(0,0,0,.25)' : 'rgba(255,85,0,.45)'; K.shadowBlur = 70; K.shadowOffsetY = 26;
  const g = K.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, '#FF8A3D'); g.addColorStop(1, '#E23A06');
  rr(-s / 2, -s / 2, s, s, s * 0.24, g); K.restore();
  if (ring) rr(-s / 2, -s / 2, s, s, s * 0.24, null, 'rgba(255,255,255,.9)', s * 0.03);
  const hl = K.createLinearGradient(0, -s / 2, 0, 0); hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  rr(-s / 2, -s / 2, s, s / 2, [s * 0.24, s * 0.24, 0, 0], hl);
  radarMarks(s * 0.3, t); K.restore();
}
// Radi: mascota original de AniRadar (bolita naranja con antena de radar)
function radi(x, y, s, t, o = {}) {
  const bob = Math.sin(t * 3.2) * 8 * s, mood = o.mood || 'happy', wave = o.wave ? Math.sin(t * 9) * 0.5 : 0;
  K.save(); K.translate(x, y + bob); K.scale(s, s);
  K.fillStyle = 'rgba(20,22,43,.12)'; K.beginPath(); K.ellipse(0, 112 - bob / s, 70, 14, 0, 0, 7); K.fill();
  // antena con ondas
  K.strokeStyle = '#3B2A25'; K.lineWidth = 8; K.lineCap = 'round'; K.beginPath(); K.moveTo(0, -88); K.lineTo(6, -132); K.stroke();
  K.save(); K.translate(8, -140); K.rotate(-0.35); K.fillStyle = '#fff'; K.beginPath(); K.ellipse(0, 0, 26, 14, 0, Math.PI, 0); K.fill(); K.strokeStyle = '#3B2A25'; K.lineWidth = 5; K.stroke(); K.restore();
  K.fillStyle = ACC; K.beginPath(); K.arc(10, -150, 7, 0, 7); K.fill();
  for (let i = 0; i < 2; i++) { const ph = ((t * 1.1 + i * 0.5) % 1); K.strokeStyle = `rgba(255,85,0,${(1 - ph) * 0.8})`; K.lineWidth = 5; K.beginPath(); K.arc(10, -150, 14 + ph * 34, -2.4, -0.7); K.stroke(); }
  // brazos
  const arm = (side, rot) => { K.save(); K.translate(side * 82, 18); K.rotate(rot); const g = K.createLinearGradient(0, -12, 0, 40); g.addColorStop(0, '#FF8A3D'); g.addColorStop(1, '#E04A0A'); K.fillStyle = g; K.beginPath(); K.ellipse(side * 10, 18, 18, 30, side * 0.5, 0, 7); K.fill(); K.restore(); };
  arm(-1, 0.1); arm(1, -0.9 - wave);
  // cuerpo
  const g = K.createRadialGradient(-30, -42, 10, 0, 0, 105); g.addColorStop(0, '#FFC08A'); g.addColorStop(0.45, '#FF7A2E'); g.addColorStop(1, '#D9420A');
  K.fillStyle = g; K.beginPath(); K.arc(0, 0, 96, 0, 7); K.fill();
  K.fillStyle = 'rgba(255,255,255,.35)'; K.beginPath(); K.ellipse(-38, -52, 22, 12, -0.6, 0, 7); K.fill();
  // ojos
  const blink = ((t + (o.seed || 0)) % 3.4) < 0.12;
  const lx = o.look || 0;
  [-34, 34].forEach((ex) => {
    if (mood === 'happy' && (t % 2.4) > 1.6 || blink) { K.strokeStyle = '#1B1530'; K.lineWidth = 7; K.beginPath(); if (blink) { K.moveTo(ex - 18, -8); K.lineTo(ex + 18, -8); } else K.arc(ex, -2, 16, Math.PI * 1.1, Math.PI * 1.9); K.stroke(); return; }
    K.fillStyle = '#fff'; K.beginPath(); K.ellipse(ex, -8, 24, 30, 0, 0, 7); K.fill();
    K.fillStyle = '#1B1530'; K.beginPath(); K.ellipse(ex + lx * 7, -4, 14, 18, 0, 0, 7); K.fill();
    K.fillStyle = '#fff'; K.beginPath(); K.arc(ex + lx * 7 + 5, -12, 5, 0, 7); K.fill();
  });
  K.fillStyle = 'rgba(255,120,150,.55)'; K.beginPath(); K.ellipse(-58, 26, 14, 8, 0, 0, 7); K.ellipse(58, 26, 14, 8, 0, 0, 7); K.fill();
  K.fillStyle = '#3B1A12'; K.beginPath(); K.moveTo(-14, 30); K.quadraticCurveTo(0, 50, 14, 30); K.closePath(); K.fill();
  K.restore();
}

/* ---------- pósters de anime reales (tipográficos: sin carátulas oficiales) ---------- */
const ANIME = {
  bleach: { t: 'Bleach: Thousand-Year Blood War', s: 'BLEACH', sub: 'Pierrot · 2022 · 13 episodios', h: 8 },
  frieren: { t: 'Frieren', s: 'FRIEREN', h: 150 },
  csm: { t: 'Chainsaw Man', s: 'CHAINSAW MAN', h: 352 },
  dandadan: { t: 'Dandadan', s: 'DANDA DAN', h: 290 },
  solo: { t: 'Solo Leveling', s: 'SOLO LEVELING', h: 222 },
  edge: { t: 'Cyberpunk: Edgerunners', s: 'EDGE RUNNERS', h: 52 },
  mob: { t: 'Mob Psycho 100', s: 'MOB PSYCHO 100', h: 268 }
};
function poster(x, y, w, h, a) {
  const r = Math.min(w, h) * 0.09;
  K.save(); K.shadowColor = 'rgba(20,22,43,.25)'; K.shadowBlur = 24; K.shadowOffsetY = 10; rr(x, y, w, h, r, '#111'); K.restore();
  K.save(); K.beginPath(); K.roundRect(x, y, w, h, r); K.clip();
  const g = K.createLinearGradient(x, y, x + w * 0.6, y + h); g.addColorStop(0, `hsl(${a.h} 75% 52%)`); g.addColorStop(1, `hsl(${(a.h + 40) % 360} 70% 16%)`); K.fillStyle = g; K.fillRect(x, y, w, h);
  K.fillStyle = 'rgba(255,255,255,.16)'; K.beginPath(); K.arc(x + w * 0.72, y + h * 0.28, w * 0.34, 0, 7); K.fill();
  K.strokeStyle = 'rgba(255,255,255,.12)'; K.lineWidth = w * 0.02; for (let i = 0; i < 5; i++) { K.beginPath(); K.moveTo(x - w * 0.2 + i * w * 0.3, y + h); K.lineTo(x + w * 0.4 + i * w * 0.3, y); K.stroke(); }
  const size = Math.max(16, Math.min(w * 0.15, 56)), lines = wrap(a.s, w * 0.84, size, 900), bh = lines.length * size * 1.05 + size * 0.95;
  const sh = K.createLinearGradient(0, y + h - bh - 30, 0, y + h); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.6)'); K.fillStyle = sh; K.fillRect(x, y + h - bh - 30, w, bh + 30);
  lines.forEach((l, i) => txt(l, x + w / 2, y + h - size * 0.6 - (lines.length - 1 - i) * size * 1.05, { size, w: 900, c: '#fff', align: 'center' }));
  K.restore();
}

/* ---------- tipografía cinética ---------- */
function KT(src, o = {}) {
  let k = 0, acc = false;
  const L = src.split('|').map((line) => line.split(' ').map((raw) => {
    let s = raw; if (s.startsWith('*')) { acc = true; s = s.slice(1); }
    const end = s.endsWith('*'); if (end) s = s.slice(0, -1);
    const it = { s, acc, t0: (o.start || 0) + (k++) * (o.stagger || 0.1) }; if (end) acc = false; return it;
  }));
  return { L, size: o.size || 96, w: o.w || 900, c: o.c || INK, ac: o.ac || ACC };
}
function drawKT(kt, cx, cy, lt) {
  const lh = kt.size * 1.14; font(kt.size, kt.w); const sp = K.measureText(' ').width;
  const pres = kt.L.map((l) => eo(P(lt, l[0].t0, l[0].t0 + 0.45)));
  const total = pres.reduce((a, p) => a + p * lh, 0); let y = cy - total / 2 + lh * 0.8;
  kt.L.forEach((line, i) => {
    if (pres[i] <= 0) return;
    const ws = line.map((w) => K.measureText(w.s).width), lw = ws.reduce((a, b) => a + b, 0) + sp * (line.length - 1);
    let x = cx - lw / 2;
    line.forEach((wd, j) => {
      const p = P(lt, wd.t0, wd.t0 + 0.5), e = eo(p);
      if (p > 0) {
        K.save(); K.globalAlpha *= cl(p * 1.7); if (p < 1) K.filter = `blur(${(1 - e) * 16}px)`;
        K.fillStyle = wd.acc ? kt.ac : kt.c; K.textAlign = 'left'; K.textBaseline = 'alphabetic'; font(kt.size, kt.w);
        K.fillText(wd.s, x, y + (1 - e) * 42); K.restore();
      }
      x += ws[j] + sp;
    });
    y += pres[i] * lh;
  });
}
function pill(cx, y, label, icon, p) { // píldora blanca con icono
  rise(p, () => {
    font(38, 700); const w = K.measureText(label).width + 140, x = cx - w / 2;
    card(x, y, w, 92, 46); icon(x + 58, y + 46, 46); txt(label, x + 98, y + 59, { size: 38, w: 700 });
  }, 40);
}

/* ---------- móvil ---------- */
function phone(cx, top, w, h, t, screen, o = {}) {
  const x = cx - w / 2, r = w * 0.15;
  K.save(); K.shadowColor = 'rgba(20,22,43,.35)'; K.shadowBlur = 80; K.shadowOffsetY = 40; rr(x, top, w, h, r, '#1A1B22'); K.restore();
  rr(x + 3, top + 3, w - 6, h - 6, r - 3, null, 'rgba(255,255,255,.18)', 3);
  const sx = x + 16, sy = top + 16, sw = w - 32, sh = h - 32;
  K.save(); K.beginPath(); K.roundRect(sx, sy, sw, sh, r - 14); K.clip();
  const g = K.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#0B0C12'); g.addColorStop(1, '#141020'); K.fillStyle = g; K.fillRect(sx, sy, sw, sh);
  const gl = K.createRadialGradient(sx + sw * 0.5, sy, 0, sx + sw * 0.5, sy, sw); gl.addColorStop(0, 'rgba(255,85,0,.22)'); gl.addColorStop(1, 'rgba(255,85,0,0)'); K.fillStyle = gl; K.fillRect(sx, sy, sw, sh);
  screen(sx, sy, sw, sh); K.restore();
  if (o.island !== false) rr(cx - 70, top + 34, 140, 40, 20, '#000');
}
function phoneHeader(sx, sy, sw, t) {
  K.save(); K.translate(sx + 62, sy + 118); K.scale(0.5, 0.5); appIcon(0, 0, 70, t); K.restore();
  txt('Ani', sx + 92, sy + 130, { size: 34, w: 900, c: '#fff' }); font(34, 900); const w = K.measureText('Ani').width; txt('Radar', sx + 92 + w, sy + 130, { size: 34, w: 900, c: ACC });
}

/* ---------- fondos ---------- */
function blob(x, y, r, c) { const g = X.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function lightBg(t) {
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#FBF7FF'); g.addColorStop(1, '#F1ECFF'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  blob(860 + 120 * Math.sin(t * 0.35), 300 + 80 * Math.cos(t * 0.3), 760, 'rgba(255,138,61,.20)');
  blob(160 + 110 * Math.cos(t * 0.28), 1380 + 120 * Math.sin(t * 0.33), 820, 'rgba(139,108,255,.20)');
  blob(900 + 90 * Math.sin(t * 0.22), 1700, 600, 'rgba(255,85,0,.10)');
  SEED = 7; for (let i = 0; i < 26; i++) { const px = rnd() * W, py = (rnd() * H - t * (18 + rnd() * 30)) % H, r = 2 + rnd() * 4; X.fillStyle = `rgba(255,120,60,${0.12 + 0.1 * Math.sin(t * 2 + i)})`; X.beginPath(); X.arc(px, py < 0 ? py + H : py, r, 0, 7); X.fill(); }
}
function scenery(x, y, w, h, t) { // fotograma original (paisaje al atardecer) para la demo de captura
  K.save(); K.beginPath(); K.roundRect(x, y, w, h, 26); K.clip();
  const g = K.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1C1B4D'); g.addColorStop(0.5, '#6B3D8F'); g.addColorStop(0.85, '#FF9A62'); K.fillStyle = g; K.fillRect(x, y, w, h);
  SEED = 3; for (let i = 0; i < 46; i++) { const sx = x + rnd() * w, sy = y + rnd() * h * 0.45; K.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`; K.beginPath(); K.arc(sx, sy, 1.5 + rnd() * 2.5, 0, 7); K.fill(); }
  const sun = K.createRadialGradient(x + w * 0.68, y + h * 0.56, 10, x + w * 0.68, y + h * 0.56, h * 0.45); sun.addColorStop(0, 'rgba(255,224,170,1)'); sun.addColorStop(0.3, 'rgba(255,190,130,.9)'); sun.addColorStop(1, 'rgba(255,150,100,0)');
  K.fillStyle = sun; K.fillRect(x, y, w, h);
  K.fillStyle = 'rgba(255,255,255,.18)'; [[0.2, 0.25, 120], [0.5, 0.18, 160], [0.82, 0.3, 110]].forEach(([a, b, r]) => { K.beginPath(); K.ellipse(x + w * a + Math.sin(t * 0.5) * 12, y + h * b, r, r * 0.22, 0, 0, 7); K.fill(); });
  K.fillStyle = '#3A2A62'; K.beginPath(); K.moveTo(x, y + h); K.lineTo(x, y + h * 0.62); K.lineTo(x + w * 0.18, y + h * 0.48); K.lineTo(x + w * 0.36, y + h * 0.63); K.lineTo(x + w * 0.55, y + h * 0.5); K.lineTo(x + w * 0.78, y + h * 0.66); K.lineTo(x + w, y + h * 0.55); K.lineTo(x + w, y + h); K.fill();
  K.fillStyle = '#21183C'; K.beginPath(); K.moveTo(x, y + h); K.lineTo(x, y + h * 0.78); K.quadraticCurveTo(x + w * 0.45, y + h * 0.68, x + w, y + h * 0.8); K.lineTo(x + w, y + h); K.fill();
  const fx = x + w * 0.3, fy = y + h * 0.74; K.fillStyle = '#120C22'; K.beginPath(); K.arc(fx, fy - 58, 15, 0, 7); K.fill(); rr(fx - 13, fy - 44, 26, 52, 10, '#120C22');
  K.beginPath(); K.moveTo(fx + 10, fy - 40); K.quadraticCurveTo(fx + 40 + Math.sin(t * 3) * 6, fy - 30, fx + 46, fy - 6); K.lineTo(fx + 8, fy - 14); K.fill();
  K.restore();
}
function confetti(cx, cy, lt, n = 90, seed = 11, spread = 1) {
  if (lt <= 0 || lt > 3.2) return; SEED = seed; const cols = [ACC, '#FFD166', '#7C5CFF', '#34D399', '#FF7AB6', '#4FC3F7'];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, v = (500 + rnd() * 900) * spread, vx = Math.cos(a) * v, vy = Math.sin(a) * v - 600 * spread, rot = rnd() * 6, vr = (rnd() - 0.5) * 14, c = cols[i % cols.length], sw = 10 + rnd() * 12;
    const x = cx + vx * lt * 0.9, y = cy + vy * lt * 0.9 + 0.5 * 1500 * lt * lt;
    K.save(); K.globalAlpha *= cl(1.4 - lt / 2.2); K.translate(x, y); K.rotate(rot + vr * lt); K.scale(1, Math.cos(lt * 8 + i)); K.fillStyle = c; K.fillRect(-sw / 2, -sw * 0.3, sw, sw * 0.6); K.restore();
  }
}
function ripple(x, y, lt, at, c = 'rgba(20,22,43,.35)') { // dedo pulsando
  const p = P(lt, at - 0.2, at + 0.5); if (p <= 0 || p >= 1) return;
  K.save(); K.globalAlpha *= 1 - p; K.fillStyle = 'rgba(255,255,255,.9)'; K.strokeStyle = c; K.lineWidth = 5;
  K.beginPath(); K.arc(x, y, 36 * (1 - p * 0.3), 0, 7); K.fill(); K.stroke(); K.beginPath(); K.arc(x, y, 44 + p * 80, 0, 7); K.stroke(); K.restore();
}

/* ---------- registro de escenas y efectos de sonido ---------- */
const SC = []; const EVENTS = [];
const ev = (t, type, v = 1) => EVENTS.push({ t: +t.toFixed(3), type, v });
function scene(a, b, draw, o = {}) { SC.push({ a, b, draw, ...o }); }
function ktEvents(a, kt) { kt.L.forEach((l) => ev(a + l[0].t0, 'swish', 0.6)); }
function rich(segs, cx, y, size) {
  font(size, 900); const w = segs.reduce((s, [t]) => s + K.measureText(t).width, 0); let x = cx - w / 2;
  segs.forEach(([t, c]) => { K.fillStyle = c; K.textAlign = 'left'; K.fillText(t, x, y); x += K.measureText(t).width; });
}

/* ---------- composición con transiciones (zoom + desenfoque entre escenas) ---------- */
const TR = 0.22;
function drawScene(sc, lt) { O.setTransform(1, 0, 0, 1, 0, 0); O.clearRect(0, 0, W, H); K = O; K.save(); sc.draw(Math.max(0, lt), sc.b - sc.a); K.restore(); K = X; }
function composite(scale, blur, alpha) {
  X.save(); X.globalAlpha = alpha; X.translate(540, 960); X.scale(scale, scale); X.translate(-540, -960);
  if (blur > 0.3) X.filter = `blur(${blur}px)`; X.drawImage(OFF, 0, 0); X.restore();
}
function renderFrame(t) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.filter = 'none'; X.globalAlpha = 1;
  lightBg(t);
  SC.forEach((sc, i) => {
    const next = SC[i + 1], prev = SC[i - 1];
    if (sc.overlay) { if (t >= sc.a) { drawScene(sc, t - sc.a); composite(1, 0, 1); } return; }
    const inStart = prev && !sc.overlay ? sc.a - TR : sc.a, outEnd = next && !next.overlay ? sc.b + TR : (next && next.overlay ? sc.b + 0.7 : sc.b);
    if (t < inStart || t >= outEnd) return;
    const lt = t - sc.a, d = sc.b - sc.a; let s = 1 + 0.025 * cl(lt / d), b = 0, al = 1;
    if (prev && t < sc.a + TR) { const q = eo(P(t, sc.a - TR, sc.a + TR)); s *= 0.93 + 0.07 * q; b = (1 - q) * 14; al = q; }
    if (next && !next.overlay && t > sc.b - TR) { const q = eio(P(t, sc.b - TR, sc.b + TR)); s *= 1 + 0.1 * q; b = q * 16; al = 1 - q; }
    drawScene(sc, lt); composite(s, b, al);
  });
}
/* ---------- fotogramas de grabaciones reales (clips/<id>/0001.jpg…), cargados bajo demanda ---------- */
const IMG = new Map(), LAST = new Map(); let MISSING = [];
function clipImg(id, lt) {
  const c = (window.CLIPS || {})[id]; if (!c) return null;
  const idx = Math.min(c.n - 1, Math.max(0, Math.floor(lt * 30))), k = `clips/${id}/${String(idx + 1).padStart(4, '0')}.jpg`, im = IMG.get(k);
  if (im && im._ok) { LAST.set(id, im); return im; }
  if (!im) MISSING.push(k); return LAST.get(id) || null;
}
function loadImg(k) {
  return new Promise((res) => { const im = new Image(); im.onload = () => { im._ok = true; res(); }; im.onerror = () => res(); im.src = k; IMG.set(k, im); });
}
const clipDur = (id) => ((window.CLIPS || {})[id] || { d: 0 }).d;

function finalize() {
  const DUR = SC[SC.length - 1].b;
  window.DUR = DUR; window.EVENTS = EVENTS.sort((a, b) => a.t - b.t);
  window.frame = async (t, q = 0.92) => {
    for (let pass = 0; pass < 4; pass++) {
      MISSING = []; renderFrame(t); if (!MISSING.length) break;
      await Promise.all([...new Set(MISSING)].map(loadImg));
    }
    if (IMG.size > 240) [...IMG.keys()].slice(0, 120).forEach((k) => IMG.delete(k));
    return C.toDataURL('image/jpeg', q);
  };
  window.ready = Promise.all(['900', '800', '700', '600'].map((w) => document.fonts.load(`${w} 100px Inter`))).then(() => true);
}
