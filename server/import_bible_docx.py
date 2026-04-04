#!/usr/bin/env python3
"""
Import Kannada Bible from a Word .docx into data/bible.json.

Expected layout (as exported from Word):
  - Book title line (e.g. "Genesis")
  - Chapter line "BookName N" (e.g. "Genesis 1")
  - One paragraph per verse: "1. verse text", "2. verse text", ...

Usage:
  python3 import_bible_docx.py /path/to/Bible.docx
  python3 import_bible_docx.py /path/to/Bible.docx --merge   # keep other books in bible.json

Requires: Python 3.9+ (stdlib only).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W_MAIN = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Protestant canon, longest names first so "1 Corinthians" matches before "Corinthians".
BOOK_NAMES: list[str] = sorted(
    [
        "Song of Solomon",
        "1 Corinthians",
        "2 Corinthians",
        "1 Thessalonians",
        "2 Thessalonians",
        "1 Timothy",
        "2 Timothy",
        "1 Peter",
        "2 Peter",
        "1 John",
        "2 John",
        "3 John",
        "1 Chronicles",
        "2 Chronicles",
        "1 Samuel",
        "2 Samuel",
        "1 Kings",
        "2 Kings",
        "Deuteronomy",
        "Lamentations",
        "Philippians",
        "Revelation",
        "Ecclesiastes",
        "Leviticus",
        "Zechariah",
        "Habakkuk",
        "Zephaniah",
        "Obadiah",
        "Nahum",
        "Micah",
        "Malachi",
        "Haggai",
        "Hosea",
        "Joel",
        "Amos",
        "Jonah",
        "Joshua",
        "Judges",
        "Numbers",
        "Genesis",
        "Exodus",
        "Daniel",
        "Esther",
        "Nehemiah",
        "Proverbs",
        "Jeremiah",
        "Ezekiel",
        "Ephesians",
        "Colossians",
        "Galatians",
        "Philemon",
        "Hebrews",
        "Matthew",
        "Romans",
        "Acts",
        "John",
        "Jude",
        "Job",
        "Psalms",
        "Psalm",
        "Ruth",
        "Mark",
        "Luke",
        "Ezra",
        "Isaiah",
        "James",
        "Titus",
    ],
    key=len,
    reverse=True,
)

_CHAPTER_LINE = re.compile(
    r"^(?P<book>.+?)\s+(?P<ch>\d+)\s*$"
)
_VERSE_LINE = re.compile(
    r"^(?P<num>\d+)\.\s*(?P<text>.+)$"
)


def _paragraph_to_text_with_breaks(p_elem: ET.Element) -> str:
    """Rebuild paragraph text; treat w:br as newline (book title / chapter / v.1 often share one w:p)."""
    parts: list[str] = []
    for r in p_elem:
        if r.tag != W_MAIN + "r":
            continue
        for node in r:
            if node.tag == W_MAIN + "t" and node.text:
                parts.append(node.text)
            elif node.tag == W_MAIN + "br":
                parts.append("\n")
    return "".join(parts)


def iter_docx_lines(docx_path: Path):
    """Yield logical lines from the document (one line per chapter heading, verse, etc.)."""
    with zipfile.ZipFile(docx_path) as z:
        with z.open("word/document.xml") as f:
            for _event, elem in ET.iterparse(f, events=("end",)):
                if elem.tag != W_MAIN + "p":
                    continue
                raw = _paragraph_to_text_with_breaks(elem)
                elem.clear()
                for line in raw.splitlines():
                    s = line.strip()
                    if s:
                        yield s


def normalize_book_name(line: str) -> str | None:
    s = line.strip()
    for name in BOOK_NAMES:
        if s == name or s.lower() == name.lower():
            return name
    return None


def parse_chapter_line(line: str) -> tuple[str, str] | None:
    m = _CHAPTER_LINE.match(line.strip())
    if not m:
        return None
    book_part = m.group("book").strip()
    ch = m.group("ch")
    for name in BOOK_NAMES:
        if book_part.lower() == name.lower():
            return name, ch
    return None


def import_docx(docx_path: Path, bible: dict) -> dict:
    current_book: str | None = None
    current_chapter: str | None = None

    for para in iter_docx_lines(docx_path):
        ch = parse_chapter_line(para)
        if ch:
            current_book, current_chapter = ch
            if current_book not in bible:
                bible[current_book] = {}
            if current_chapter not in bible[current_book]:
                bible[current_book][current_chapter] = {}
            continue

        title = normalize_book_name(para)
        if title and len(para) < 80:
            if title not in bible:
                bible[title] = {}
            continue

        vm = _VERSE_LINE.match(para)
        if vm and current_book and current_chapter:
            num = vm.group("num")
            text = vm.group("text").strip().replace("\u00a0", " ")
            bible[current_book][current_chapter][num] = text

    return bible


def main() -> int:
    ap = argparse.ArgumentParser(description="Import Bible .docx to bible.json")
    ap.add_argument("docx", type=Path, help="Path to Bible.docx")
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "data" / "bible.json",
        help="Output bible.json path",
    )
    ap.add_argument(
        "--merge",
        action="store_true",
        help="Load existing bible.json and merge (overwrite same verses)",
    )
    args = ap.parse_args()

    if not args.docx.is_file():
        print(f"File not found: {args.docx}", file=sys.stderr)
        return 1

    bible: dict = {}
    if args.merge and args.out.is_file():
        bible = json.loads(args.out.read_text(encoding="utf-8"))

    bible = import_docx(args.docx, bible)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(bible, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    books = sorted(bible.keys())
    print(f"Wrote {args.out} ({len(books)} books).")
    for b in books[:5]:
        chs = bible[b]
        print(f"  {b}: {len(chs)} chapters")
    if len(books) > 5:
        print(f"  ... and {len(books) - 5} more books")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
