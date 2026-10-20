#!/usr/bin/env python3
"""Genera la banda sonora del anuncio: música original + efectos sincronizados con los eventos del vídeo.
Todo se sintetiza aquí con numpy (sin muestras ni música de terceros → sin reclamaciones de copyright).
Uso: python3 audio.py events.json salida.wav [--no-music]
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi):
    """Filtro paso banda por FFT con bordes suaves."""
    if len(x) < 8:
        return x
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    return np.fft.irfft(np.fft.rfft(x) * m, len(x))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, t, harm=8, decay=0.0):
    out = np.zeros_like(t)
    for k in range(1, harm + 1):
        if f * k > 16000:
            break
        out += np.sin(2 * np.pi * f * k * t + k) / k * (np.exp(-t * decay * k) if decay else 1)
    return out


# ---------------- instrumentos ----------------
def pluck(f, d=0.45):
    t = t_axis(d)
    return saw(f, t, 8, 3.0) * np.exp(-t * 7) * np.clip(t / 0.004, 0, 1)


def pad(freqs, d):
    t = t_axis(d)
    s = sum(saw(f * dt, t, 6) for f in freqs for dt in (0.996, 1.004))
    env = np.clip(t / 0.5, 0, 1) * np.clip((d - t) / 0.7, 0, 1)
    return band(s, 140, 2400) * env


def bass(f, d=0.26):
    t = t_axis(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 7) * np.clip(t / 0.006, 0, 1)


def kick():
    t = t_axis(0.4)
    ph = 2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 28)) / SR
    return np.sin(ph) * np.exp(-t * 9) + band(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 300) * 0.3


def clap():
    t = t_axis(0.25)
    n = band(rng.standard_normal(len(t)), 900, 5000)
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return n * env * 0.5


def hat():
    t = t_axis(0.06)
    return band(rng.standard_normal(len(t)), 7000, 15000) * np.exp(-t * 70)


def bell(f, d=1.2):
    t = t_axis(d)
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc) for r, a, dc in ((1, 1, 3.2), (2.76, 0.35, 6), (5.4, 0.15, 10))) * np.clip(t / 0.002, 0, 1)


# ---------------- efectos ----------------
def sfx(kind, v):
    if kind == 'swish':
        t = t_axis(0.38); env = np.sin(np.pi * np.clip(t / 0.38, 0, 1)) ** 2
        return band(rng.standard_normal(len(t)), 2500, 11000) * env * 0.16 * v, 'sweep'
    if kind == 'whoosh':
        t = t_axis(0.7); env = np.clip(t / 0.4, 0, 1) ** 2 * np.clip((0.7 - t) / 0.3, 0, 1)
        n = band(rng.standard_normal(len(t)), 300, 7000) * env
        low = np.sin(2 * np.pi * np.cumsum(180 - 110 * t / 0.7) / SR) * env * 0.4
        return (n * 0.35 + low) * 0.55 * v, 'sweep'
    if kind == 'key':
        t = t_axis(0.03)
        return (band(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t * 260) + 0.3 * np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 400)) * 0.16 * v, rng.uniform(-0.4, 0.4)
    if kind == 'tap':
        t = t_axis(0.06)
        return (np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 90) + band(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t * 400) * 0.5) * 0.32 * v, 0
    if kind == 'pop':
        t = t_axis(0.12); ph = 2 * np.pi * np.cumsum(500 + 900 * np.clip(t / 0.05, 0, 1)) / SR
        return np.sin(ph) * np.exp(-t * 38) * 0.32 * v, rng.uniform(-0.3, 0.3)
    if kind == 'ding':
        d = bell(mtof(88)) + 0.8 * np.concatenate([np.zeros(int(0.08 * SR)), bell(mtof(95))])[: int(1.2 * SR)]
        return d * 0.2 * v, 0
    if kind == 'bell':
        return (bell(mtof(91), 0.8) + 0.7 * np.concatenate([np.zeros(int(0.12 * SR)), bell(mtof(88), 0.8)])[: int(0.8 * SR)]) * 0.18 * v, 0
    if kind == 'scan':
        d = 0.9 * v; t = t_axis(d); f = 300 + 1300 * (t / d) ** 1.5
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t)) * np.sin(np.pi * t / d) * 0.1, 0
    if kind == 'rise':
        t = t_axis(0.9); f = 420 + 520 * t / 0.9
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.9) * 0.07, 0
    if kind == 'tick':
        t = t_axis(0.02)
        return np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 350) * 0.12 * v, 0.2
    if kind == 'boing':
        t = t_axis(0.32); f = 320 + 380 * np.clip(t / 0.12, 0, 1) + 25 * np.sin(2 * np.pi * 22 * t)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.2, 0.25
    if kind == 'boom':
        t = t_axis(1.4)
        sub = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 10)) / SR) * np.exp(-t * 3.2)
        thump = band(rng.standard_normal(len(t)), 40, 400) * np.exp(-t * 14) * 0.5
        return (sub + thump) * 0.55 * v, 0
    if kind == 'confetti':
        out = np.zeros(int(0.9 * SR))
        for _ in range(14):
            s, _p = sfx('pop', 0.35); o = int(rng.uniform(0, 0.6) * SR); out[o:o + len(s)] += s[: len(out) - o]
        t = t_axis(0.9); out += sum(np.sin(2 * np.pi * rng.uniform(2500, 4200) * t) * np.exp(-t * rng.uniform(5, 9)) * 0.025 for _ in range(6))
        return out * v, 0
    if kind == 'sparkle':
        out = np.zeros(int(1.2 * SR))
        for i, m in enumerate((96, 100, 103, 108)):
            b = bell(mtof(m), 0.8) * 0.09; o = int(i * 0.07 * SR); out[o:o + len(b)] += b[: len(out) - o]
        return out * v, 0
    return np.zeros(1), 0


def place(L, R, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= len(L) or len(sig) == 0:
        return
    sig = sig[: len(L) - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def music(L, R, dur):
    beat = 0.55                      # 109 bpm: el ritmo entra justo con la 2.ª escena (4,4 s = 8 tiempos)
    prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]  # C G Am F
    drums_from, end = 4.4, dur
    nb = int(dur / beat) + 1
    for b in range(nb):
        t0 = b * beat
        if t0 >= end:
            break
        bar, pos = divmod(b, 4)
        root, chord = prog[bar % 4]
        if pos == 0:
            place(L, R, t0, pad([mtof(n) for n in chord], beat * 4 + 0.6), 0.022)
        for half in (0, 1):                      # arpegio en corcheas
            n = chord[(b * 2 + half) % 3] + 12 + (12 if (b * 2 + half) % 4 == 3 else 0)
            place(L, R, t0 + half * beat / 2, pluck(mtof(n)), 0.055 if t0 >= drums_from else 0.04, 0.35 if half else -0.35)
        if t0 >= drums_from - 1e-6:
            if pos in (0, 2):
                place(L, R, t0, kick(), 0.42)
            if pos in (1, 3):
                place(L, R, t0, clap(), 0.2, 0.1)
            for half in (0, 1):
                place(L, R, t0 + half * beat / 2, hat(), 0.05 if half else 0.03, 0.4)
                place(L, R, t0 + half * beat / 2, bass(mtof(root - 12)), 0.15)


def main():
    ev_file, out = sys.argv[1], sys.argv[2]
    data = json.load(open(ev_file))
    dur = float(data['dur']) + 0.2
    L = np.zeros(int(dur * SR)); R = np.zeros(int(dur * SR))
    if '--no-music' not in sys.argv:
        music(L, R, dur)
    for e in data['events']:
        s, pan = sfx(e['type'], float(e.get('v', 1)))
        if pan == 'sweep':
            n = len(s); p = np.linspace(-0.6, 0.6, n) if rng.random() > 0.5 else np.linspace(0.6, -0.6, n)
            i = int(e['t'] * SR); s = s[: max(0, len(L) - i)]; p = p[: len(s)]
            L[i:i + len(s)] += s * np.sqrt((1 - p) / 2); R[i:i + len(s)] += s * np.sqrt((1 + p) / 2)
        else:
            place(L, R, e['t'], s, 1.0, pan)
    fade = int(1.5 * SR); env = np.ones(len(L)); env[-fade:] = np.linspace(1, 0, fade)
    st = np.stack([L, R], 1) * env[:, None]
    st = np.tanh(st * 1.1) / np.tanh(1.1)                    # limitador suave
    st *= 0.89 / max(1e-9, np.abs(st).max())
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    main()
