#!/usr/bin/env python3
"""Extract JPEG from Brave MCP evaluate_script dump (b64 or byte array)."""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from pathlib import Path


def load_payload(text: str) -> bytes:
    if m := re.search(r'"b64":"([^"]+)"', text):
        return base64.b64decode(m.group(1))
    idx = text.find("[")
    if idx >= 0:
        end = text.rfind("]")
        if end > idx:
            arr = json.loads(text[idx : end + 1])
            if isinstance(arr, list) and arr and isinstance(arr[0], int):
                return bytes(arr)
    brace = text.find("{")
    if brace >= 0:
        end = text.rfind("}")
        data = json.loads(text[brace : end + 1])
        if isinstance(data, dict) and "b64" in data:
            return base64.b64decode(data["b64"])
        if isinstance(data, list):
            return bytes(data)
    raise ValueError("Could not find image bytes in MCP output")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("mcp_output_txt")
    ap.add_argument("output_jpg")
    args = ap.parse_args()
    text = Path(args.mcp_output_txt).read_text()
    out = Path(args.output_jpg)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(load_payload(text))
    print(out, out.stat().st_size, file=sys.stderr)


if __name__ == "__main__":
    main()