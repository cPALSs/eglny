#!/usr/bin/env python3
"""Decode Brave MCP evaluate output: JSON array of byte values -> JPEG file."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: decode-ig-fetch-json.py <input.json> <output.jpg>", file=sys.stderr)
        sys.exit(1)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    data = json.loads(src.read_text())
    if isinstance(data, dict) and "b64" in data:
        import base64

        dst.write_bytes(base64.b64decode(data["b64"]))
    elif isinstance(data, list):
        dst.write_bytes(bytes(data))
    else:
        raise SystemExit(f"unexpected JSON shape: {type(data)}")
    dst.parent.mkdir(parents=True, exist_ok=True)
    print(dst, dst.stat().st_size)


if __name__ == "__main__":
    main()