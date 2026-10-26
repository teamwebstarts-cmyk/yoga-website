#!/usr/bin/env python3
"""Neutralize links to non-existent template pages in index.html -> href="#".

Kept untouched: "#" (already empty), index.html (self), images/resource/gallery
links (Fancybox lightbox, real assets), images/favicon.png, css/*.css,
mailto:, tel:. Nothing else changes.
"""
import re
from pathlib import Path

p = Path(r"D:\webstarts\yogava\index.html")
src = p.read_text(encoding="utf-8")

PATTERNS = [
    r'href="page-[^"]+\.html"',
    r'href="news-[^"]+\.html"',
    r'href="shop-[^"]+\.html"',
    r'href="index-2\.html"',
]

total = 0
for pat in PATTERNS:
    src, n = re.subn(pat, 'href="#"', src)
    print(f"{pat}  ->  {n} replaced")
    total += n

p.write_text(src, encoding="utf-8", newline="\n")
print(f"TOTAL replacements: {total}")

# sanity: what page-link hrefs remain? (should be none)
leftover = re.findall(r'href="(?:page|news|shop)-[^"]*\.html"', src) + re.findall(r'href="index-2\.html"', src)
print(f"leftover page-links: {len(leftover)}")
# confirm preserved items are untouched
keep = {
    'href="index.html"': src.count('href="index.html"'),
    'href="#"': src.count('href="#"'),
    'href="images/resource/': src.count('href="images/resource/'),
    'href="mailto:': src.count('href="mailto:'),
    'href="tel:': src.count('href="tel:'),
    'href="css/': src.count('href="css/'),
    'forms action=index.html': len(re.findall(r'action="index\.html"', src)),
}
for k, v in keep.items():
    print(f"kept  {k}: {v}")
