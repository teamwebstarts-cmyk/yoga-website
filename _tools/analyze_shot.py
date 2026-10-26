#!/usr/bin/env python3
"""Analyze a screenshot: size, brightness profile, dominant colors per region."""
import sys
import numpy as np
from PIL import Image

def analyze(path):
    img = Image.open(path).convert("RGB")
    a = np.asarray(img, dtype=np.float32)
    h, w, _ = a.shape
    print(f"== {path}")
    print(f"   size: {w}x{h}")
    gray = a.mean(axis=2)
    print(f"   mean brightness: {gray.mean():.1f} (255=white)")
    # fraction of near-white pixels
    print(f"   near-white: {(gray > 245).mean() * 100:.1f}%  near-black: {(gray < 10).mean() * 100:.1f}%")
    # sample rows: top band, middle, bottom band
    for name, sl in [("top 10%", slice(0, h // 10)), ("middle", slice(h // 2 - 50, h // 2 + 50)), ("bottom 10%", slice(int(h * 0.9), h))]:
        band = a[sl].reshape(-1, 3).mean(axis=0)
        print(f"   {name}: avg RGB = ({band[0]:.0f}, {band[1]:.0f}, {band[2]:.0f})")
    # dominant colors (coarse quantization)
    q = (a.reshape(-1, 3) // 32 * 32).astype(np.uint8)
    colors, counts = np.unique(q, axis=0, return_counts=True)
    order = np.argsort(-counts)[:5]
    tops = ", ".join(f"({c[0]},{c[1]},{c[2]}):{counts[i] * 100.0 / q.shape[0]:.1f}%" for c, i in zip(colors[order], order))
    print(f"   top colors: {tops}")

for p in sys.argv[1:]:
    analyze(p)
