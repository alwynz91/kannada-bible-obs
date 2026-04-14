#!/usr/bin/env python3
"""
Split verse strings where a later verse number was pasted into the wrong key
(e.g. Luke 8:52 contains '... 53. ಹೆಂ ಆಯ್ಕುನ್ ...' instead of separate key '53').

Detects patterns like: (non-digit) + N + '.' + whitespace, with N > current verse;
prefers the smallest such N (usually v+1 when verses were merged sequentially).

Usage:
  python3 fix_embedded_verse_numbers.py           # rewrite ../data/bible.json
  python3 fix_embedded_verse_numbers.py --dry-run # print stats only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent
_DEFAULT_JSON = _REPO / "data" / "bible.json"

# Verse marker: not preceded by a digit (avoid mid-numbers), then "12. " style.
_EMBED = re.compile(r"(?<![0-9])(\d{1,3})\.\s+")


def expand_verse_block(start_verse: int, text: str) -> dict[int, str]:
    """Split *text* for key *start_verse* into {verse_num: fragment, ...}."""
    out: dict[int, str] = {}
    v = start_verse
    rem = text
    while rem:
        match_obj = None
        split_at = 0
        # Prefer next consecutive verse (v+1, v+2, …) — typical OCR/import merge.
        for n in range(v + 1, v + 80):
            pat = rf"(?<![0-9]){n}\.\s+"
            mo = re.search(pat, rem)
            if mo:
                match_obj = mo
                split_at = n
                break
        if match_obj is None:
            for mo in _EMBED.finditer(rem):
                n = int(mo.group(1))
                if n > v:
                    match_obj = mo
                    split_at = n
                    break
        if match_obj is None:
            out[v] = rem
            break
        head = rem[: match_obj.start()].rstrip()
        if head:
            out[v] = head
        rem = rem[match_obj.end() :].lstrip()
        v = split_at
    return out


def fix_chapter(ch: dict) -> tuple[dict[str, str], int]:
    """Return new chapter dict (string keys) and number of extra verses extracted."""
    merged: dict[str, str] = {}
    extra = 0
    for k in sorted(ch.keys(), key=lambda x: int(x)):
        v = int(k)
        t = ch[k]
        if not isinstance(t, str):
            merged[k] = t  # type: ignore[assignment]
            continue
        parts = expand_verse_block(v, t)
        extra += max(0, len(parts) - 1)
        for pv, pt in parts.items():
            sk = str(pv)
            if sk in merged:
                merged[sk] = (merged[sk].rstrip() + " " + pt.lstrip()).strip()
            else:
                merged[sk] = pt
    return merged, extra


def fix_bible(bible: dict) -> tuple[dict, int]:
    total_extra = 0
    new_bible: dict = {}
    for book, chapters in bible.items():
        if not isinstance(chapters, dict):
            new_bible[book] = chapters
            continue
        new_book: dict = {}
        for ch_name, ch in chapters.items():
            if not isinstance(ch, dict):
                new_book[ch_name] = ch
                continue
            fixed, n = fix_chapter(ch)
            total_extra += n
            new_book[ch_name] = fixed
        new_bible[book] = new_book
    return new_bible, total_extra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--json-path", type=Path, default=_DEFAULT_JSON)
    args = ap.parse_args()

    if not args.json_path.is_file():
        print(f"Not found: {args.json_path}", file=sys.stderr)
        return 1

    bible = json.loads(args.json_path.read_text(encoding="utf-8"))
    fixed, total = fix_bible(bible)
    print(f"Embedded verse splits (extra keys carved out): {total}")

    if args.dry_run:
        # Spot-check Luke 8
        l8 = fixed.get("Luke", {}).get("8", {})
        for vn in ("52", "53", "40", "41"):
            if vn in l8:
                tail = l8[vn][-80:] if len(l8[vn]) > 80 else l8[vn]
                print(f"  Luke 8:{vn} tail: …{tail}")
        return 0

    args.json_path.write_text(
        json.dumps(fixed, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {args.json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
