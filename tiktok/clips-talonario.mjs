// Graba Talonario (talonario/index.html) de verdad, en un móvil de 390×755, y guarda cada fragmento como fotogramas
// tiktok/clips/<id>/0001.jpg… (768×1488, 30 fps), con el mismo formato que clips.mjs. Los añade a clips/index.js SIN borrar los demás.
// Uso: node tiktok/clips-talonario.mjs [--slow 1.5] [--only concepto,pagada]
//   --slow N  ralentiza la página N veces mientras se graba (animaciones CSS y tecleo) y acelera al montar: así las ~20 capturas/s
//             reales dan 30 fotogramas/s efectivos sin repetir casi ninguno.
// Cada fragmento guarda también sus marcas de sonido (ev: [[segundo, 'key'|'tap'|'stamp'|'total'|'scroll'], …]) para sincronizar promo-talonario.html.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', 'talonario');
const clipsDir = path.join(here, 'clips');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SLOW = +arg('--slow', 1.5);
const ONLY = arg('--only', '') ? arg('--only', '').split(',') : null;
const FPS = 30;
const pwPath = process.env.PLAYWRIGHT_MODULE || (fs.existsSync('/opt/node-tools/node_modules/playwright') ? '/opt/node-tools/node_modules/playwright/index.mjs' : 'playwright');
const { chromium } = await import(pwPath);
const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : (fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

// Mini servidor (copiado de talonario/test/smoke.mjs): la app necesita HTTP para cargar sus fuentes
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));

// Idioma de la interfaz en español (en Linux Chromium lo toma del entorno, no de --lang): así los <input type=date> se ven como dd/mm/aaaa
const browser = await chromium.launch({ ...launch, env: { ...process.env, LANGUAGE: 'es_ES:es', LC_ALL: 'es_ES.UTF-8', LANG: 'es_ES.UTF-8' } });
const ctx = await browser.newContext({ viewport: { width: 390, height: 755 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-ES', timezoneId: 'Europe/Madrid' });
// Datos del emisor ya guardados (la app los recuerda «para la próxima») y forma de pago en el borrador; sin diálogo de impresión.
await ctx.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem('tal_issuer', JSON.stringify({ name: 'Marta López Ruiz', nif: '12345678A', addr: 'Calle Mayor 3, 2.º B, 28013 Madrid', email: 'marta@ejemplo.com', phone: '', retSel: '15', ret: '15' }));
  localStorage.setItem('tal_draft', JSON.stringify({ payment: 'Transferencia a ES12 3456 7890 1234 5678 9012', notes: 'Gracias por confiar en mí. Pago a 30 días.' }));
  window.print = () => {};
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('Error en la página:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: 'html{scrollbar-width:none} ::-webkit-scrollbar{display:none}' });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });
await page.waitForTimeout(400);

/* ---------- utilidades ---------- */
const sleep = (s) => page.waitForTimeout(s * 1000 * SLOW);           // s = segundos del vídeo final
let REC = null;                                                      // grabación en curso: { t0, frames, ev }
const now = () => (Date.now() - REC.t0) / 1000 / SLOW;
const mark = (type, ...more) => { if (REC) REC.ev.push([+now().toFixed(3), type, ...more]); };
const sel = (s) => page.locator(s).first();
async function tapAt(s) { const b = await sel(s).boundingBox(); await sel(s).click(); mark('tap', +((b.x + b.width / 2) / 390).toFixed(3), +((b.y + b.height / 2) / 755).toFixed(3)); } // toque con su posición
const tap = tapAt;
async function type(s, text, delay = 0.085) {                        // teclea letra a letra con ritmo humano
  await tapAt(s); await sleep(0.25);
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]); mark('key');
    await sleep(delay * (0.7 + 0.6 * ((i * 7919) % 11) / 10) + (text[i] === ' ' ? 0.05 : 0));
  }
}
async function replace(s, text, delay) { await tapAt(s); await sel(s).selectText(); await sleep(0.2); for (const ch of text) { await page.keyboard.type(ch); mark('key'); await sleep(delay); } }
// Scroll instantáneo o suave (con setTimeout + performance.now(): el reloj de requestAnimationFrame va ralentizado por Animation.setPlaybackRate)
const scrollTo = (s, off, instant = true) => page.evaluate(([q, o, ms]) => new Promise((res) => {
  const el = document.querySelector(q); const y1 = Math.max(0, el.getBoundingClientRect().top + scrollY - o);
  if (!ms) { scrollTo(0, y1); return res(); }
  const y0 = scrollY, t0 = performance.now();
  const step = () => { const p = Math.min(1, (performance.now() - t0) / ms), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; scrollTo(0, y0 + (y1 - y0) * e); if (p < 1) setTimeout(step, 16); else res(); };
  step();
}), [s, off, instant ? 0 : 1100 * SLOW]);

// Graba mientras corre `action`: captura JPEG en bucle y remuestrea a 30 fps en tiempo de vídeo (acelerado SLOW veces)
async function record(id, action) {
  if (ONLY && !ONLY.includes(id)) { REC = { t0: Date.now(), frames: [], ev: [], mute: true }; await action(); REC = null; return; }
  REC = { t0: Date.now(), frames: [], ev: [] };
  let done = false; const run = action().then(() => { done = true; });
  while (!done) { const t = now(); const buf = await page.screenshot({ type: 'jpeg', quality: 92, caret: 'initial' }); REC.frames.push({ t, buf }); }
  await run;
  const { frames, ev } = REC; REC = null;
  const dur = frames[frames.length - 1].t, n = Math.max(1, Math.round(dur * FPS));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-')); let j = 0;
  for (let k = 0; k < n; k++) { const t = k / FPS; while (j + 1 < frames.length && frames[j + 1].t <= t) j++; fs.writeFileSync(path.join(tmp, String(k + 1).padStart(4, '0') + '.jpg'), frames[j].buf); }
  const dir = path.join(clipsDir, id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%04d.jpg'), '-vf', 'scale=768:1488:flags=lanczos', '-q:v', '3', path.join(dir, '%04d.jpg')]);
  fs.rmSync(tmp, { recursive: true, force: true });
  index[id] = { n, d: +(n / FPS).toFixed(3), ev };
  console.log(`✓ ${id}: ${n} fotogramas (${(n / FPS).toFixed(2)} s) a partir de ${frames.length} capturas (${(frames.length / dur / SLOW).toFixed(1)} capturas/s reales)`);
}

/* ---------- índice: conserva los fragmentos que ya existen ---------- */
const indexFile = path.join(clipsDir, 'index.js');
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8').replace(/^window\.CLIPS\s*=\s*/, '').replace(/;\s*$/, '')) : {};

/* ---------- los fragmentos ---------- */
const grp = (i) => `.grp:nth-of-type(${i})`;
const row = (i, f) => `#lineas .linea:not(.linea-cab):nth-of-type(${i + 2}) [data-f=${f}]`; // +2: la cabecera es el primer .linea

// (a) el cliente
await scrollTo(grp(2), 96);
await record('cliente', async () => {
  await sleep(0.55);
  await type('#cNombre', 'Estudio Norte S.L.', 0.08);
  await sleep(0.3);
  await type('#cNif', 'B12345678', 0.09);
  await sleep(0.3);
  await type('#cDir', 'Av. Diagonal 100, Barcelona', 0.06);
  await sleep(0.7);
});

// (b) concepto y precio: el total de la barra de abajo cambia solo
await scrollTo(grp(4), 92);
await record('concepto', async () => {
  await sleep(0.5);
  await type(row(0, 'desc'), 'Diseño de la web corporativa', 0.07);
  await sleep(0.3);
  await tapAt(row(0, 'price')); await sleep(0.3);
  for (const ch of '1200') { await page.keyboard.type(ch); mark('key'); await sleep(0.16); }
  mark('total');
  await sleep(1.0);
});

// (c) segunda línea
await record('linea', async () => {
  await sleep(0.4);
  await tap('#btnLinea'); await sleep(0.55);
  for (const ch of 'Mantenimiento mensual') { await page.keyboard.type(ch); mark('key'); await sleep(0.07 + (ch === ' ' ? 0.06 : 0)); }
  await sleep(0.3);
  await replace(row(1, 'qty'), '3', 0.2);
  await sleep(0.25);
  await tapAt(row(1, 'price')); await sleep(0.3);
  for (const ch of '150') { await page.keyboard.type(ch); mark('key'); await sleep(0.16); }
  mark('total');
  await sleep(1.0);
});

// (d) la hoja: baja hasta la vista previa y se queda en los totales
await record('hoja', async () => {
  await sleep(0.3);
  mark('scroll'); await scrollTo('#hoja', 22, false);
  await sleep(2.5);
});

// (e) marcar como pagada: cae el sello
await record('pagada', async () => {
  await sleep(0.7);
  await tapAt('.hoja-opciones label'); mark('stamp');
  await sleep(2.5);
});

// (f) descargar PDF
await record('pdf', async () => {
  await sleep(0.6);
  await tap('#btnPdfMovil');
  await sleep(2.2);
});

if (index.pagada) index.pagada.fecha = await page.evaluate(() => document.querySelector('#hoja .sello small')?.textContent || '');
fs.writeFileSync(indexFile, `window.CLIPS = ${JSON.stringify(index)};\n`);
console.log('índice:', Object.keys(index).join(', '));
await browser.close(); server.close();
