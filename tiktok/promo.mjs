// Renderiza un anuncio (promo.html o promo-real.html) a MP4 con música y efectos generados (audio.py).
// Uso: node tiktok/promo.mjs [--page promo-real.html] [--name aniradar-real] [--stills] [--music-only|--sfx-only]
//   Salida en tiktok/out/: <name>.mp4 (música + efectos) y <name>-sin-musica.mp4 (solo efectos, para poner un sonido de TikTok)
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const pageFile = arg('--page', 'promo.html');
const name = arg('--name', 'aniradar-promo');
const out = path.join(here, 'out');
const stills = process.argv.includes('--stills');
const FPS = 30;
fs.mkdirSync(out, { recursive: true });

// Servidor local: el lienzo solo puede exportar fotogramas de los clips si página e imágenes comparten origen
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(here) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('pageerror', (e) => console.error('Error en la página:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${pageFile}`);
await page.evaluate(() => window.ready);
const { dur, events } = await page.evaluate(() => ({ dur: window.DUR, events: window.EVENTS }));
const save = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
const shot = (t, q) => page.evaluate(([x, y]) => window.frame(x, y), [t, q]);
const finish = async () => { await browser.close(); server.close(); };

if (stills) {
  const dir = path.join(out, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const ts = (process.env.TIMES || '').split(',').filter(Boolean).map(Number);
  for (const t of ts.length ? ts : Array.from({ length: Math.floor(dur * 2) }, (_, i) => i * 0.5)) save(path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.jpg`), await shot(t, 0.8));
  await finish(); process.exit(0);
}

save(path.join(out, `${name}-portada.jpg`), await shot(1.6, 0.95));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-'));
const video = path.join(tmp, 'video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', video], { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = Math.round(dur * FPS);
for (let i = 0; i < frames; i++) {
  const url = await shot(i / FPS, 0.92);
  if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`  fotograma ${i}/${frames}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
await finish();

const evFile = path.join(tmp, 'events.json');
fs.writeFileSync(evFile, JSON.stringify({ dur, events }));
for (const [file, extra] of [[name, []], [name + '-sin-musica', ['--no-music']]]) {
  const wav = path.join(tmp, file + '.wav');
  execFileSync('python3', [path.join(here, 'audio.py'), evFile, wav, ...extra], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', wav, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-ar', '44100', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(out, file + '.mp4')], { stdio: 'inherit' });
  console.log('✓', path.join(out, file + '.mp4'));
}
fs.rmSync(tmp, { recursive: true, force: true });
