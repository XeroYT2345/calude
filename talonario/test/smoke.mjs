// Prueba de humo de Talonario: sirve la carpeta por HTTP, rellena una factura, comprueba cálculos, impresión, Pro y móvil.
// Uso: node talonario/test/smoke.mjs            (CHROMIUM_PATH y PLAYWRIGHT_MODULE opcionales)
// Sale con código 1 si falla alguna comprobación. Las capturas quedan en talonario/test/out/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const pwPath = process.env.PLAYWRIGHT_MODULE || (fs.existsSync('/opt/node-tools/node_modules/playwright') ? '/opt/node-tools/node_modules/playwright/index.mjs' : 'playwright');
const { chromium } = await import(pwPath);
const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : (fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html`;

const norm = (s) => String(s).replace(/[\u00A0\u202F]/g, ' ').trim();
let fallos = 0; const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fallos++; };
const browser = await chromium.launch(launch);
const fill = (p) => p.evaluate(() => {
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  set('iNombre', 'Marta López Ruiz'); set('iNif', '12345678A'); set('iDir', 'Calle Mayor 3, 2.º B, 28013 Madrid'); set('iEmail', 'marta@ejemplo.com');
  set('cNombre', 'Estudio Norte S.L.'); set('cNif', 'B12345678'); set('cDir', 'Av. Diagonal 100, 08019 Barcelona');
  const row = (i) => document.querySelectorAll('#lineas .linea:not(.linea-cab)')[i];
  const sl = (i, f, v) => { const el = row(i).querySelector(`[data-f=${f}]`); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  sl(0, 'desc', 'Diseño de la web corporativa'); sl(0, 'price', '1200'); document.getElementById('btnLinea').click();
  sl(1, 'desc', 'Mantenimiento mensual'); sl(1, 'qty', '3'); sl(1, 'price', '150');
  set('fPago', 'Transferencia a ES12 3456 7890 1234 5678 9012'); set('fNotas', 'Gracias por confiar en mí. Pago a 30 días.');
});

try {
  console.log('Escritorio');
  let p = await browser.newPage({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const fontReq = []; p.on('response', (r) => { if (r.url().includes('/fonts/')) fontReq.push(r.status()); });
  await p.route(/googleapis|gstatic/, (r) => r.abort());
  await p.goto(URL_); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  ok(await p.locator('#campoExento').isHidden(), 'el motivo del 0 % de IVA empieza oculto');
  ok((await p.textContent('#aviso')).startsWith('Para descargar falta'), 'aviso neutro antes de intentar descargar');
  await fill(p); await p.waitForTimeout(300);
  ok(norm(await p.textContent('#totalVivo')) === '1.749,00 €', 'total 1.749,00 € (base 1.650 + IVA 346,50 − IRPF 247,50)');
  ok((await p.textContent('#aviso')) === '', 'sin avisos con la factura completa');
  ok(fontReq.length > 0 && fontReq.every((s) => s === 200), `fuentes locales cargan (${fontReq.length} archivos)`);
  ok(await p.evaluate(() => [...document.fonts].some((f) => f.family === 'Bricolage Grotesque' && f.status === 'loaded')), 'Bricolage Grotesque cargada sin Google');
  await p.screenshot({ path: path.join(out, 'escritorio.png') });
  await p.check('#chkPagada'); await p.waitForTimeout(450); ok((await p.locator('#hoja .sello').count()) === 1, 'sello PAGADA en la hoja');
  await p.evaluate(() => { window.print = () => { window.__printed = true; }; }); await p.click('#btnPdf'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__printed === true), 'Descargar PDF lanza la impresión');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_seq') || '{}')['2026'] === 1), 'numeración guardada');
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('header')).display === 'none' && getComputedStyle(document.querySelector('#impresion')).display === 'block'), 'en impresión solo se ve la hoja');
  await p.screenshot({ path: path.join(out, 'impresion.png'), fullPage: true }); await p.emulateMedia({ media: 'screen' });
  await p.click('#btnPro'); await p.fill('#inClave', 'TALONARIO-DEMO'); await p.click('#btnActivar'); await p.waitForTimeout(1200);
  ok((await p.textContent('#btnPro')) === 'Pro activo', 'Pro se activa con el código de prueba');
  ok((await p.locator('#hoja .hoja-credito').count()) === 0, 'Pro quita la línea de crédito');
  await p.click('#btnPdf'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_history') || '[]').length === 1), 'Pro guarda la factura en el historial');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_clients') || '[]')[0]?.nif === 'B12345678'), 'Pro guarda el cliente');
  await p.click('#btnNueva'); await p.waitForTimeout(200); ok((await p.inputValue('#fNum')) === '002', 'Nueva factura pasa al 002');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await p.close();

  console.log('Móvil');
  p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs2 = []; p.on('pageerror', (e) => errs2.push(e.message));
  await p.route(/googleapis|gstatic/, (r) => r.abort()); await p.goto(URL_); await p.evaluate(() => document.fonts.ready); await fill(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento horizontal');
  ok(await p.locator('.barra').isVisible(), 'barra fija con el total visible');
  await p.screenshot({ path: path.join(out, 'movil.png'), fullPage: true });
  ok(errs2.length === 0, 'sin errores de JavaScript en móvil');
  await p.close();
} finally { await browser.close(); server.close(); }
console.log(fallos ? `\n${fallos} comprobación(es) fallida(s)` : '\nTodo correcto');
process.exit(fallos ? 1 : 0);
