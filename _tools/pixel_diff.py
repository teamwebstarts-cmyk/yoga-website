#!/usr/bin/env python3
"""Pixel-compare two full-page screenshots: overall similarity + worst rows."""
import sys
import numpy as np
from PIL import Image

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
print(f"A: {a.size}, B: {b.size}")
w = min(a.size[0], b.size[0])
h = min(a.size[1], b.size[1])
aa = np.asarray(a.crop((0, 0, w, h)), dtype=np.int16)
bb = np.asarray(b.crop((0, 0, w, h)), dtype=np.int16)
diff = np.abs(aa - bb).mean(axis=2)
print(f"mean abs diff: {diff.mean():.2f} / 255")
print(f"pixels >30 diff: {(diff > 30).mean() * 100:.2f}%")
# per-band analysis (10 bands)
band = h // 10
for i in range(10):
    d = diff[i * band:(i + 1) * band]
    print(f"  band {i} (y={i * band}-{(i + 1) * band}): mean {d.mean():6.2f}  worst-row {d.mean(axis=1).max():6.1f}")
# worst rows
rowmeans = diff.mean(axis=1)
worst = np.argsort(-rowmeans)[:8]
print("worst rows:", [(int(r), round(float(rowmeans[r]), 1)) for r in sorted(worst)])
