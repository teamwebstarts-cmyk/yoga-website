#!/usr/bin/env python3
"""Build local index.html from the recovered original, cleaning Cloudflare artifacts."""
import re

src = open(r"D:\webstarts\yogava\_original.html", encoding="utf-8").read()

# 1. Decode Cloudflare-protected emails into plain mailto links
cfemail_map = {
    "335b565f4373505c5e43525d4a1d505c5e": "help@company.com",
    "751c1b131a35100d14180519105b161a18": "info@example.com",
}
def decode_cfemail(hexstr: str) -> str:
    key = int(hexstr[:2], 16)
    return "".join(chr(int(hexstr[i:i+2], 16) ^ key) for i in range(2, len(hexstr), 2))

# Verify mapping is correct
for hx, expected in cfemail_map.items():
    assert decode_cfemail(hx) == expected, hx

# Replace the mobile-menu email link (span wrapper form)
src = re.sub(
    r'<a href="/cdn-cgi/l/email-protection[^"]*"><span class="__cf_email__" data-cfemail="335b565f4373505c5e43525d4a1d505c5e">\[email&#160;protected\]</span></a>',
    '<a href="mailto:help@company.com">help@company.com</a>',
    src,
)
# Replace the footer email link (anchor class form)
src = re.sub(
    r'<a href="/cdn-cgi/l/email-protection[^"]*" class="__cf_email__" data-cfemail="751c1b131a35100d14180519105b161a18">\[email&#160;protected\]</a>',
    '<a href="mailto:info@example.com">info@example.com</a>',
    src,
)

# 2. Remove Cloudflare email-decode script
src = src.replace('<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>', "")

# 3. Remove the Cloudflare challenge-platform bootstrapping script (last inline script)
src = re.sub(
    r'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?\}\)\(\);</script>',
    "",
    src,
    flags=re.DOTALL,
)

# Sanity checks
assert "cdn-cgi" not in src, "cdn-cgi still referenced"
assert "help@company.com" in src and "info@example.com" in src

open(r"D:\webstarts\yogava\index.html", "w", encoding="utf-8", newline="\n").write(src)
print("index.html written:", len(src), "bytes")
