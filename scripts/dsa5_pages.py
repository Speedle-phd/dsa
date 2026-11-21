"""Extract text for printed DSA5 rulebook pages, e.g. `python scripts/dsa5_pages.py 225-230`.

Requires: pip install pypdf
"""

import argparse
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path(__file__).resolve().parent.parent / "DSA5 rulebook.pdf"
# PDF page index = printed page number + PAGE_OFFSET - 1
PAGE_OFFSET = 3


def parse_range(value: str) -> range:
    start, _, end = value.partition("-")
    return range(int(start), int(end or start) + 1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "pages", nargs="+", help="Printed page or range, e.g. 183 or 225-230"
    )
    parser.add_argument(
        "--grep", help="Only print pages containing this text (case-insensitive)"
    )
    parser.add_argument("--offset", type=int, default=PAGE_OFFSET)
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    reader = PdfReader(PDF_PATH)

    for spec in args.pages:
        for page in parse_range(spec):
            index = page + args.offset - 1
            if not 0 <= index < len(reader.pages):
                print(f"=== S. {page}: out of range ===")
                continue
            text = reader.pages[index].extract_text() or ""
            if args.grep and args.grep.lower() not in text.lower():
                continue
            print(f"=== S. {page} ===\n{text}\n")


if __name__ == "__main__":
    main()
