"""Extract text for printed DSA5 book pages.

    python scripts/dsa5_pages.py 225-230                    # Regelwerk (default)
    python scripts/dsa5_pages.py 276-282 --book kraeuter    # Archiv der Kräuter

Requires: pip install pypdf
"""

import argparse
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
# book key -> (PDF file in the repo root, offset); PDF page index = printed page number + offset - 1
BOOKS = {
    "regelwerk": ("DSA5 rulebook.pdf", 3),
    "kraeuter": ("Archiv_der_Kraeuter.pdf", 1),
}


def parse_range(value: str) -> range:
    start, _, end = value.partition("-")
    return range(int(start), int(end or start) + 1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "pages", nargs="+", help="Printed page or range, e.g. 183 or 225-230"
    )
    parser.add_argument(
        "--grep", help="Only print pages containing this text (case-insensitive)"
    )
    parser.add_argument("--book", choices=sorted(BOOKS), default="regelwerk")
    parser.add_argument("--offset", type=int, help="Override the book's page offset")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8") # type: ignore
    filename, offset = BOOKS[args.book]
    if args.offset is not None:
        offset = args.offset
    reader = PdfReader(ROOT / filename)

    for spec in args.pages:
        for page in parse_range(spec):
            index = page + offset - 1
            if not 0 <= index < len(reader.pages):
                print(f"=== S. {page}: out of range ===")
                continue
            text = reader.pages[index].extract_text() or ""
            if args.grep and args.grep.lower() not in text.lower():
                continue
            print(f"=== S. {page} ===\n{text}\n")


if __name__ == "__main__":
    main()
