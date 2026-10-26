#!/usr/bin/env python3
"""Download all fonts referenced by local CSS files."""
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(r"D:\webstarts\yogava")
BASE = "https://html.kodesolution.com/2026/yogava-html"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"}

fonts = set()
for css in (ROOT / "css").glob("*.css"):
    text = css.read_text(encoding="utf-8", errors="replace")
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", text):
        v = m.group(1).strip()
        if v.startswith("http") or v.startswith("data:"):
            continue
        if v.startswith("../"):
            v = v[3:]
        v = v.split("?")[0].split("#")[0]
        if re.search(r"\.(ttf|otf|woff2?|eot|svg)$", v):
            fonts.add(v)

print(f"Fonts to fetch: {len(fonts)}")
failed = []
for f in sorted(fonts):
    dest = ROOT / f
    if dest.exists() and dest.stat().st_size > 0:
        print(f"SKIP {f}")
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = f"{BASE}/{f}"
    ok = False
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers=UA)
            data = urllib.request.urlopen(req, timeout=60).read()
            dest.write_bytes(data)
            ok = True
            break
        except Exception as e:
            print(f"  retry {attempt} {f}: {e}")
            time.sleep(0.4 * attempt)
    if ok:
        print(f"OK   {f} ({dest.stat().st_size})")
    else:
        print(f"FAIL {f}")
        failed.append(f)
    time.sleep(0.15)

print(f"FAILED: {len(failed)}")
for f in failed:
    print(f"  {f}")
print("FONTS-DONE")
