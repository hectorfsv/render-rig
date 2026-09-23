#!/usr/bin/env python3
"""Generate the stand-in imagery the populated-state harness needs.

Writes test/build/imgs.js. Not committed - 548K of base64 does not belong in a
repo that GitHub Pages serves. Pure stdlib, no Pillow.
"""
import zlib, struct, base64, math, random, os, pathlib

def png(w, h, fn):
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes(fn(x, y, w, h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))

def nebula(x, y, w, h):
    cx, cy = w * .52, h * .46
    d = math.hypot((x - cx) / w, (y - cy) / h) * 2.4
    g = math.exp(-d * d * 1.7)
    swirl = .5 + .5 * math.sin(math.atan2(y - cy, x - cx) * 3 + d * 7)
    n = random.randint(-7, 7)
    return (max(0, min(255, int(min(255, 26 + 210 * g + 46 * swirl * g)) + n)),
            max(0, min(255, int(min(255, 14 + 120 * g * g + 30 * swirl * g)) + n)),
            max(0, min(255, int(min(255, 22 + 70 * g * g)) + n)))

def portrait(x, y, w, h):
    cx, cy = w * .5, h * .42
    d = math.hypot((x - cx) / (w * .34), (y - cy) / (h * .46))
    inside = d < 1
    base = (196, 150, 118) if inside else (30, 26, 32)
    v = 1 - .35 * d if inside else 1
    n = random.randint(-6, 6)
    return tuple(max(0, min(255, int(c * v) + n)) for c in base)

out = pathlib.Path(__file__).parent / 'build'
out.mkdir(exist_ok=True)
imgs = {}
random.seed(7)
imgs['RES'] = png(560, 315, nebula)          # a 16:9 "render" for the stage
for i, key in enumerate(['S1', 'S2', 'S3']):  # three tray sources
    random.seed(11 + i)
    imgs[key] = png(120, 120, portrait)

js = 'var IMG=' + repr({k: 'data:image/png;base64,' + base64.b64encode(v).decode()
                        for k, v in imgs.items()}).replace("'", '"') + ';'
(out / 'imgs.js').write_text(js)
print('wrote %s (%.0f KB)' % (out / 'imgs.js', (out / 'imgs.js').stat().st_size / 1024))
