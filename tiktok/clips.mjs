// Extrae los fragmentos de tu grabación de pantalla (según clips.json) como fotogramas para promo-real.html.
// Uso: node tiktok/clips.mjs ruta/a/la/grabacion.mp4
// Crea tiktok/clips/<id>/0001.jpg… y tiktok/clips/index.js (número de fotogramas y duración de cada fragmento).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error('Uso: node tiktok/clips.mjs grabacion.mp4'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'clips.json'), 'utf8'));
const dir = path.join(here, 'clips');
fs.rmSync(dir, { recursive: true, force: true });
const index = {};
for (const c of cfg.clips) {
  const d = path.join(dir, c.id); fs.mkdirSync(d, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(c.in), '-to', String(c.out), '-i', src,
    '-vf', `crop=${cfg.crop},setpts=(PTS-STARTPTS)/${c.speed},fps=30,scale=768:-2:flags=lanczos,unsharp=5:5:0.6`, '-q:v', '3', path.join(d, '%04d.jpg')], { stdio: 'inherit' });
  const n = fs.readdirSync(d).filter((f) => f.endsWith('.jpg')).length;
  index[c.id] = { n, d: +(n / 30).toFixed(3) };
  console.log(`✓ ${c.id}: ${n} fotogramas (${(n / 30).toFixed(2)} s)`);
}
fs.writeFileSync(path.join(dir, 'index.js'), `window.CLIPS = ${JSON.stringify(index)};\n`);
