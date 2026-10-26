#!/usr/bin/env python3
"""Extract base64 screenshot from a CDP response JSON file and save as PNG."""
import base64
import json
import sys

src, dest = sys.argv[1], sys.argv[2]
with open(src, encoding="utf-8") as f:
    data = json.load(f)
# response is {"result": {"data": "<base64>"}} or {"data": ...}
b64 = data.get("result", data).get("data")
if not b64:
    print("no data field found; keys:", list(data.keys()), list(data.get("result", {}).keys()))
    sys.exit(1)
with open(dest, "wb") as f:
    f.write(base64.b64decode(b64))
print(f"saved {dest} ({len(b64) * 3 // 4} bytes)")
