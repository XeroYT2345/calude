// Prueba de humo de Talonario: sirve la carpeta por HTTP, rellena una factura, comprueba cálculos, impresión, Pro y móvil.
// Uso: node talonario/test/smoke.mjs            (CHROMIUM_PATH, PLAYWRIGHT_MODULE y TAL_PAGE opcionales)
// Sale con código 1 si falla alguna comprobación. Las capturas quedan en talonario/test/out/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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
const URL_ = `http://127.0.0.1:${server.address().port}/${process.env.TAL_PAGE || 'index.html'}`;

const norm = (s) => String(s).replace(/[  ]/g, ' ').trim();
let fallos = 0; const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fallos++; };
const browser = await chromium.launch(launch);
const A4_PX = 1123; // 297 mm a 96 ppp (1122,5 px)
// Páginas de un PDF: con pdfinfo si está instalado; si no, contando objetos /Type /Page
const paginas = (file) => { try { return +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file], { encoding: 'utf8' }))[1]; } catch (_) { return (fs.readFileSync(file, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; } };
// Escribe en un campo como lo haría una persona (dispara input/change)
const set = (p, id, v) => p.evaluate(([id, v]) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
const setLinea = (p, i, f, v) => p.evaluate(([i, f, v]) => { const el = document.querySelectorAll('#lineas .linea:not(.linea-cab)')[i].querySelector(`[data-f=${f}]`); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, [i, f, v]);
const total = async (p) => norm(await p.textContent('#totalVivo'));
async function fill(p) {
  for (const [id, v] of [['iNombre', 'Marta López Ruiz'], ['iNif', '12345678A'], ['iDir', 'Calle Mayor 3, 2.º B, 28013 Madrid'], ['iEmail', 'marta@ejemplo.com'],
    ['cNombre', 'Estudio Norte S.L.'], ['cNif', 'B12345678'], ['cDir', 'Av. Diagonal 100, 08019 Barcelona'], ['fRetSel', '15'],
    ['fPago', 'Transferencia a ES12 3456 7890 1234 5678 9012'], ['fNotas', 'Gracias por confiar en mí. Pago a 30 días.']]) await set(p, id, v);
  await setLinea(p, 0, 'desc', 'Diseño de la web corporativa'); await setLinea(p, 0, 'price', '1200');
  await p.click('#btnLinea'); await setLinea(p, 1, 'desc', 'Mantenimiento mensual'); await setLinea(p, 1, 'qty', '3'); await setLinea(p, 1, 'price', '150');
}
const nueva = async (vp) => { const p = await browser.newPage(vp); p.on('dialog', (d) => d.accept()); await p.route(/googleapis|gstatic/, (r) => r.abort()); return p; };

try {
  console.log('Escritorio');
  let p = await nueva({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const fontReq = []; p.on('response', (r) => { if (r.url().includes('/fonts/')) fontReq.push(r.status()); });
  await p.goto(URL_); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  ok(await p.locator('#campoExento').isHidden(), 'el motivo del 0 % de IVA empieza oculto');
  ok((await p.textContent('#aviso')).startsWith('Para descargar falta'), 'aviso neutro antes de intentar descargar');
  ok(await p.evaluate(() => !!document.querySelector('#impresion .hoja')), 'la hoja de impresión está lista desde el principio (Ctrl+P)');
  ok(await p.evaluate(() => { const d = new Date(); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; return document.getElementById('fFecha').value === iso; }), 'la fecha de hoy es la local, no la UTC');
  await fill(p); await p.waitForTimeout(300);
  ok(await total(p) === '1.749,00 €', 'total 1.749,00 € (base 1.650 + IVA 346,50 − IRPF 247,50)');
  ok((await p.textContent('#aviso')) === '', 'sin avisos con la factura completa');
  for (const v of ['1.200,40', '1200,40', '1 200,40', '1200.40']) { await setLinea(p, 0, 'price', v); ok(await total(p) === '1.749,42 €', `entiende el precio escrito «${v}»`); }
  await setLinea(p, 0, 'price', '1.200'); ok(await total(p) === '1.749,00 €', 'entiende «1.200» como mil doscientos');
  await setLinea(p, 0, 'price', '1200');
  await p.click('#btnLinea'); await p.waitForTimeout(100);
  ok((await p.locator('#hoja table.items tbody tr').count()) === 2, 'una línea vacía no aparece en la hoja');
  ok(await p.evaluate(() => document.querySelector('#impresion').innerHTML.includes('Marta López Ruiz')), 'la hoja de impresión se actualiza al escribir');
  await p.locator('#lineas .linea:not(.linea-cab)').last().locator('.quitar').click(); await p.waitForTimeout(100);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.closest('#lineas') !== null), 'al quitar una línea el foco se queda en los conceptos');
  ok(fontReq.length > 0 && fontReq.every((s) => s === 200), `fuentes locales cargan (${fontReq.length} archivos)`);
  ok(await p.evaluate(() => [...document.fonts].some((f) => f.family === 'Bricolage Grotesque' && f.status === 'loaded')), 'Bricolage Grotesque cargada sin Google');
  await p.screenshot({ path: path.join(out, 'escritorio.png') });
  await p.check('#chkPagada'); await p.waitForTimeout(450); ok((await p.locator('#hoja .sello').count()) === 1, 'sello PAGADA en la hoja');
  await p.evaluate(() => { window.print = () => { window.__printed = true; }; }); await p.click('#btnPdf'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__printed === true), 'Descargar PDF lanza la impresión');
  ok(await p.evaluate(() => document.title === 'Factura 2026-001 Estudio Norte S.L.'), 'el PDF se guarda con el nombre de la factura');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_seq') || '{}')['2026'] === 1), 'numeración guardada');
  ok((await p.textContent('#aviso')) === '', 'tras descargar, el número propio no se marca como repetido');
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('header')).display === 'none' && getComputedStyle(document.querySelector('#impresion')).display === 'block'), 'en impresión solo se ve la hoja');
  const altoImp = await p.evaluate(() => document.documentElement.scrollHeight);
  ok(altoImp <= A4_PX, `la factura cabe en una página A4 (${altoImp} px ≤ ${A4_PX})`);
  ok(await p.evaluate(() => !!document.querySelector('#impresion .pg > tfoot .hoja-credito')), 'la línea de crédito va en el pie que se repite en cada página impresa');
  await p.screenshot({ path: path.join(out, 'impresion.png'), fullPage: true }); await p.emulateMedia({ media: null }); // sin emulación: page.pdf() usa el CSS de impresión
  const pdf1 = path.join(out, 'factura.pdf'); fs.writeFileSync(pdf1, await p.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true }));
  ok(paginas(pdf1) === 1, `el PDF real tiene una sola página (${paginas(pdf1)})`);
  await p.evaluate(() => { for (let i = 0; i < 30; i++) { document.getElementById('btnLinea').click(); const rows = document.querySelectorAll('#lineas .linea:not(.linea-cab)'); const r = rows[rows.length - 1]; const d = r.querySelector('[data-f=desc]'); d.value = 'Línea ' + (i + 1) + ': un concepto largo que ocupa bastante espacio en la hoja para probar el salto de página'; d.dispatchEvent(new Event('input', { bubbles: true })); const pr = r.querySelector('[data-f=price]'); pr.value = '10'; pr.dispatchEvent(new Event('input', { bubbles: true })); } });
  await p.waitForTimeout(200);
  const pdf2 = path.join(out, 'factura-larga.pdf'); fs.writeFileSync(pdf2, await p.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true }));
  ok(paginas(pdf2) >= 2 && paginas(pdf2) <= 4, `una factura de 32 líneas largas ocupa entre dos y cuatro páginas (${paginas(pdf2)})`);
  ok(await p.evaluate(() => { const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); const vis = [...document.querySelectorAll('.faq details')].map((d) => [d.querySelector('summary').textContent.trim(), d.querySelector('.resp').textContent.trim()]); return ld.mainEntity.length === vis.length && ld.mainEntity.every((q, i) => q.name === vis[i][0] && q.acceptedAnswer.text === vis[i][1]); }), 'el JSON-LD de la FAQ coincide con las preguntas visibles');
  await set(p, 'fNum', '001'); await p.waitForTimeout(100); await set(p, 'fNum', '001');
  await p.click('#btnNueva'); await p.waitForTimeout(200); ok((await p.inputValue('#fNum')) === '002', 'Nueva factura pasa al 002');
  await set(p, 'fNum', '001'); ok((await p.textContent('#aviso')).includes('ya se usó'), 'avisa si repites un número ya usado');
  await set(p, 'fNum', '002');
  await p.click('#btnPro'); await p.fill('#inClave', 'TALONARIO-DEMO'); await p.press('#inClave', 'Enter'); await p.waitForTimeout(1200);
  ok(await p.locator('#proInsignia').isVisible() && await p.locator('#btnPro').isHidden(), 'Pro se activa con el código de prueba pulsando Enter');
  ok((await p.locator('#hoja .hoja-credito').count()) === 0, 'Pro quita la línea de crédito');
  await fill(p); await p.waitForTimeout(200); await p.click('#btnPdf'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_history') || '[]').length === 1), 'Pro guarda la factura en el historial');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('tal_clients') || '[]')[0]?.nif === 'B12345678'), 'Pro guarda el cliente');
  await p.click('#btnNueva'); await p.waitForTimeout(200); ok((await p.inputValue('#fNum')) === '003', 'tras la segunda factura pasa al 003');
  await set(p, 'cNif', 'X0000000X'); await set(p, 'cNombre', 'Estudio Norte S.L.'); await p.waitForTimeout(100);
  ok((await p.inputValue('#cNif')) === 'X0000000X' && (await p.inputValue('#cDir')) === 'Av. Diagonal 100, 08019 Barcelona', 'el autocompletado rellena solo los campos vacíos');
  await setLinea(p, 0, 'desc', 'Consultoría'); await setLinea(p, 0, 'price', '500');
  await set(p, 'fPais', 'EU'); await p.waitForTimeout(200);
  ok((await p.textContent('#iNifLabel')) === 'NIF-IVA' && (await p.textContent('#hoja')).includes('Inversión del sujeto pasivo') && await p.locator('#campoRetSel').isHidden(), 'preset UE: NIF-IVA, inversión del sujeto pasivo y sin IRPF');
  await set(p, 'fPais', 'MX'); await p.waitForTimeout(200);
  ok((await p.textContent('#hoja .hoja-titulo')) === 'Recibo' && (await p.textContent('#iNifLabel')) === 'RFC' && !(await p.locator('#pistaPais').isHidden()), 'preset México: Recibo, RFC y aviso del CFDI');
  await set(p, 'fPais', 'ES'); await p.waitForTimeout(200);
  ok((await p.textContent('#hoja .hoja-titulo')) === 'Factura' && (await p.inputValue('#fRetSel')) === '', 'volver a España restaura Factura y pide la retención');
  await set(p, 'fPais', 'ES-IC'); await p.waitForTimeout(200);
  ok((await p.textContent('#hoja')).includes('IGIC 7 %') && !(await p.locator('#campoRetSel').isHidden()), 'preset Canarias: IGIC al 7 % y retención de IRPF');
  await set(p, 'fPais', 'ES'); await set(p, 'fTipo', 'presupuesto'); await p.waitForTimeout(150);
  ok((await p.inputValue('#fNum')) === '001' && (await p.textContent('#fVenceLabel')) === 'Válido hasta' && await p.locator('#optPagada').isHidden() && (await p.textContent('#hoja .hoja-titulo')) === 'Presupuesto', 'presupuesto: numeración propia, «Válido hasta» y sin sello');
  await set(p, 'fTipo', 'simplificada'); await set(p, 'cNif', ''); await set(p, 'cDir', ''); await p.waitForTimeout(150);
  ok((await p.inputValue('#fNum')) === '003' && !(await p.textContent('#aviso')).startsWith('Para descargar') && (await p.textContent('#aviso')).includes('400'), 'factura simplificada: sin datos del cliente y aviso por encima de 400 €');
  await set(p, 'fTipo', 'factura'); await setLinea(p, 0, 'tax', '0'); await p.waitForTimeout(150);
  ok(!(await p.locator('#campoExento').isHidden()) && (await p.textContent('#aviso')).includes('motivo del 0 %'), 'con una línea al 0 % pide el motivo');
  await set(p, 'fExento', 'Operación exenta de IVA conforme al artículo 20 de la Ley 37/1992.'); await p.waitForTimeout(100);
  ok((await p.textContent('#hoja')).includes('artículo 20') , 'la mención de exención sale en la hoja');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await p.close();

  console.log('Móvil');
  p = await nueva({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs2 = []; p.on('pageerror', (e) => errs2.push(e.message));
  await p.goto(URL_); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => { window.print = () => { window.__printed = true; }; }); await p.click('#btnPdfMovil'); await p.waitForTimeout(300);
  ok((await p.textContent('#avisoMovil')).startsWith('Falta') && await p.locator('#avisoMovil').isVisible() && !(await p.evaluate(() => window.__printed)), 'en móvil el error se ve en la barra y no se imprime');
  await fill(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento horizontal');
  ok(await p.locator('.barra').isVisible(), 'barra fija con el total visible');
  ok((await p.textContent('#avisoMovil')) === '', 'el aviso de la barra se vacía al completar');
  await p.click('#btnPdfMovil'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__printed === true && document.getElementById('toast').textContent.includes('Guardar como PDF')), 'en móvil avisa de elegir «Guardar como PDF» al descargar');
  ok(await p.evaluate(() => [...document.querySelectorAll('#form input:not([type=file]), #form select, #form textarea')].every((el) => parseFloat(getComputedStyle(el).fontSize) >= 16)), 'los campos tienen al menos 16 px (sin zoom en iOS)');
  await p.screenshot({ path: path.join(out, 'movil.png'), fullPage: true });
  await p.setViewportSize({ width: 320, height: 640 }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin desbordamiento a 320 px');
  ok(errs2.length === 0, 'sin errores de JavaScript en móvil');
  await p.close();
} finally { await browser.close(); server.close(); }
console.log(fallos ? `\n${fallos} comprobación(es) fallida(s)` : '\nTodo correcto');
process.exit(fallos ? 1 : 0);
