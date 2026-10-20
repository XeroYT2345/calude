// Renderiza los vídeos de render.html a MP4 (1080×1920, 30 fps, H.264 + pista de audio en silencio).
// Uso: node tiktok/render.mjs [salida] [--stills]
//   --stills  → solo exporta fotogramas sueltos (para revisar el diseño rápido) y la portada de cada vídeo
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(here, 'out'));
const stillsOnly = process.argv.includes('--stills');
const FPS = 30;
const NAMES = ['identifica', 'que-anime-ver', 'calendario'];
const COVER_AT = { identifica: 1.4, 'que-anime-ver': 1.2, calendario: 1.6 };
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
await page.goto(pathToFileURL(path.join(here, 'render.html')).href);
await page.evaluate(() => window.ready);

const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

for (const name of NAMES) {
  const dur = await page.evaluate((n) => window.setup(n), name);
  save(path.join(out, `${name}-portada.jpg`), await page.evaluate((t) => window.frame(t, 0.95), COVER_AT[name]));
  if (stillsOnly) {
    for (let t = 0.5; t < dur; t += 1.5) save(path.join(out, `${name}-t${t.toFixed(1)}.jpg`), await page.evaluate((x) => window.frame(x, 0.8), t));
    continue;
  }
  const file = path.join(out, `${name}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(dur * FPS);
  for (let i = 0; i < frames; i++) {
    const url = await page.evaluate((t) => window.frame(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  console.log('✓', file, `(${frames} fotogramas)`);
}
await browser.close();
