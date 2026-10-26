#!/usr/bin/env python3
"""Fetch jQuery UI sprite icons referenced by css/jquery-ui.css (loaded by index.html)."""
import time
import urllib.request
from pathlib import Path

ROOT = Path(r"D:\webstarts\yogava")
BASE = "https://html.kodesolution.com/2026/yogava-html/images"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"}

names = [
    "ui-icons_444444_256x240.png",
    "ui-icons_555555_256x240.png",
    "ui-icons_777620_256x240.png",
    "ui-icons_777777_256x240.png",
    "ui-icons_cc0000_256x240.png",
    "ui-icons_ffffff_256x240.png",
]
for n in names:
    dest = ROOT / "images" / n
    if dest.exists() and dest.stat().st_size > 0:
        print(f"SKIP {n}")
        continue
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(f"{BASE}/{n}", headers=UA)
            data = urllib.request.urlopen(req, timeout=60).read()
            dest.write_bytes(data)
            print(f"OK   images/{n} ({len(data)})")
            break
        except Exception as e:
            print(f"  retry {attempt}: {e}")
            time.sleep(0.5 * attempt)
    else:
        print(f"FAIL {n}")
    time.sleep(0.2)
print("UI-ICONS-DONE")
