#!/usr/bin/env python3
"""
Merge Konkani / community .docx files from ~/Downloads into data/bible.json,
then reorder book keys to Catholic canon order.

Edit KONKANI_DOCX_FILES if you add more volumes.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_SERVER = Path(__file__).resolve().parent
_REPO = _SERVER.parent
_OUT = _REPO / "data" / "bible.json"
_DOWNLOADS = Path.home() / "Downloads"

# Filenames you provided (order does not matter for merge).
KONKANI_DOCX_FILES: list[str] = [
    "Joel 1.docx",
    "Konkani Bible 1 and 2 Thessalonians - SANDRA.docx",
    "Konkani Bible 1 and 2 samuel - Joel lobo - Mlore.docx",
    "Konkani Bible Colossians  - ROSHWIN.docx",
    "Konkani Bible Deuteronomy - DIMPI MACHADO.docx",
    "Konkani Bible Exodus - AARON DSOUZA - Mumbai.docx",
    "Konkani Bible Galatians  - CYRUS RODRIGUES.docx",
    "Konkani Bible Genesis -  PREEMA MARIA LOBO.docx",
    "Konkani Bible Jeremiah - MELITA.docx",
    "Konkani Bible Joshua - NIKITHA NORONHA.docx",
    "Konkani Bible Judges - SELVITA SALOMI .docx",
    "Konkani Bible Lamentations- FLAVIA DSOUZA (1).docx",
    "Konkani Bible Leviticus - ELROY PEREIRA.docx",
    "Konkani Bible Numbers - WATSON TAURO.docx",
    "Konkani Bible Ruth - AARON DSOUZA - Mlore.docx",
    "Konkani Bible Sirach - RONAK.docx",
]


def _load_importer():
    path = _SERVER / "import_bible_docx.py"
    spec = importlib.util.spec_from_file_location("import_bible_docx", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def prune_empty_books(bible: dict) -> dict:
    """Drop books with no chapters or only empty verse maps (stray title lines in docx)."""
    out: dict = {}
    for name, chs in bible.items():
        if not isinstance(chs, dict) or not chs:
            continue
        cleaned = {c: v for c, v in chs.items() if isinstance(v, dict) and v}
        if cleaned:
            out[name] = cleaned
    return out


def main() -> int:
    mod = _load_importer()
    import_docx = mod.import_docx
    reorder_bible_catholic = mod.reorder_bible_catholic

    if not _OUT.is_file():
        print(f"Missing {_OUT}; create it or run a single import first.", file=sys.stderr)
        return 1

    bible: dict = json.loads(_OUT.read_text(encoding="utf-8"))
    merged = 0
    for fn in KONKANI_DOCX_FILES:
        if fn.startswith("~$"):
            continue
        p = _DOWNLOADS / fn
        if not p.is_file():
            print(f"Skip (not found): {p}", file=sys.stderr)
            continue
        print(f"Merge: {p.name}")
        bible = import_docx(p, bible)
        merged += 1

    if merged == 0:
        print("No docx files merged. Check Downloads paths.", file=sys.stderr)
        return 1

    bible = prune_empty_books(bible)
    bible = reorder_bible_catholic(bible)
    _OUT.write_text(json.dumps(bible, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    books = list(bible.keys())
    print(f"Wrote {_OUT} ({len(books)} books, Catholic key order).")
    for b in books[:8]:
        print(f"  {b}: {len(bible[b])} chapters")
    if len(books) > 8:
        print(f"  ... +{len(books) - 8} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
