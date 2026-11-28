"""Generate server/src/utils/herbs/herbData.ts (facts only) from the local Archiv der Kräuter PDF.

Usage (repo root):
    python scripts/adk_herbs.py Archiv_der_Kraeuter.pdf server/src/utils/herbs/herbData.ts report.txt
    python scripts/adk_herbs.py Archiv_der_Kraeuter.pdf server/src/utils/herbs/herbData.ts report.txt --digest 23 44 digest.txt
The report lists fields that could not be read. The digest prints the raw effect and knowledge text of plants
<first>..<last> (1-based, book order) as input for the next batch of summaries in herbSummaries.ts; keep it out of git.
Requires: pip install pypdf
"""
import json
import re
import sys
from pypdf import PdfReader

pdf, out_ts, out_report = sys.argv[1:4]
digest = sys.argv[5:8] if len(sys.argv) > 7 and sys.argv[4] == "--digest" else None
reader = PdfReader(pdf)
sys.stdout.reconfigure(encoding="utf-8")

# ---- plants from the bookmarks (printed page = PDF index, offset 1)
plants = []


def walk(items, depth, parent):
    last = None
    for item in items:
        if isinstance(item, list):
            walk(item, depth + 1, last)
            continue
        title = " ".join(item.title.split())
        last = title
        if depth == 2 and parent == "Aventurisches Herbarium" and title != "Aufbau der Pflanzenbeschreibung":
            plants.append((title, reader.get_destination_page_number(item)))


walk(reader.outline, 0, None)


def squash(value):
    return re.sub(r"[\s-]", "", value).lower()


# ---- effect types from the overview table (S. 266–270): column by x position, shifted by the table margin
COLUMNS = ["Heilung", "Gift", "physisch", "psychisch", "Nützlich", "Wehrhaft", "Übernatürlich"]
effects = {}
for index in range(266, 272):
    names, marks, header = [], [], []

    def on_text(text, cm, tm, font, size):
        clean = " ".join(text.replace("\xad", "-").split())
        if clean.startswith("Pflanze Heilung"):
            header.append(tm[4])
        elif clean and tm[4] < 100:
            names.append((round(tm[5]), clean))

    def on_op(op, args, cm, tm):
        if op == b"Tj" and args and args[0] == b"X":
            marks.append((round(tm[4]), round(tm[5])))

    text = reader.pages[index].extract_text(visitor_text=on_text, visitor_operand_before=on_op)
    if "Heilung Gift" not in text:
        continue
    shift = (header[0] - 36) if header else 0
    rows = {}
    for y, name in sorted(names, key=lambda entry: -entry[0]):
        if any(abs(my - y) <= 2 for _, my in marks):
            rows[y] = name
        elif rows:
            upper = min(rows)
            if 0 < upper - y < 16:
                rows[upper] = rows[upper] + " " + name
    for y, name in rows.items():
        xs = [168 + 59 * i for i in range(7)]
        effects[squash(name)] = [COLUMNS[i] for i, x in enumerate(xs) if any(abs(mx - x - shift) <= 6 and abs(my - y) <= 2 for mx, my in marks)]


def norm(value):
    value = value.replace("\xad", "")
    value = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", value)
    return " ".join(value.split())


def field(text, label, stops):
    match = re.search(label + r":\s*(.+?)(?=" + "|".join(r"\n\s*" + s for s in stops) + r")", text, re.S)
    return norm(match.group(1)) if match else None


def modifier(value):
    """'–3' -> (-3, None); '+/–0' -> (0, None); '–5 (Note)' -> (-5, 'Note')"""
    if value is None:
        return None, None
    match = re.match(r"^([+–-]?/?[+–-]?\s*\d+)\s*(.*)$", value)
    if not match:
        return None, value
    number = match.group(1).replace("+/–", "").replace("+/-", "").replace("–", "-").replace(" ", "")
    note = match.group(2).strip().strip("()") or None
    return int(number), note


def price(value):
    if value is None:
        return {"raw": None, "processed": None, "note": None}
    match = re.match(r"^(\d+(?:,\d+)?)\s*/\s*(\d+(?:,\d+)?)\s*Silbertaler\s*(.*)$", value)
    if not match:
        return {"raw": None, "processed": None, "note": value}
    note = match.group(3).strip().strip("()").lstrip(", ").strip() or None
    return {"raw": float(match.group(1).replace(",", ".")), "processed": float(match.group(2).replace(",", ".")), "note": note}


def applications(value):
    match = re.match(r"^(\d+(?:/\d+){5})\s*(.*)$", value or "")
    if not match:
        return None, value
    return [int(x) for x in match.group(1).split("/")], (match.group(2).strip().strip("()") or None)


def page_text(index):
    text = reader.pages[index].extract_text() or ""
    nxt = [i for _, i in plants if i > index]
    if nxt and nxt[0] > index + 1:
        text += "\n" + (reader.pages[index + 1].extract_text() or "")
    return text


rows, report, digests = [], [], []
for number, (name, index) in enumerate(plants, start=1):
    text = page_text(index)
    search, search_note = modifier(field(text, "Suchschwierigkeit", ["Bestimmungsschwierigkeit:"]))
    identify, identify_note = modifier(field(text, "Bestimmungsschwierigkeit", ["Anwendungen:"]))
    apps, apps_note = applications(field(text, "Anwendungen", ["Wirkung", "Preis:"]))
    landscape = field(text, "Landschaftstyp", ["Regionen:", "Suchschwierigkeit:"])
    regions = field(text, "Regionen", ["Suchschwierigkeit:"])
    section = text.split("Rezepte:", 1)[1].split("Alltagsarzneien und Volksbrauchtum", 1)[0] if "Rezepte:" in text else ""
    section = norm(section)
    recipes = []
    for match in re.finditer(r"([^,:()]+?)\s*\(siehe\s+(Regelwerk\s+)?Seite\s+(\d+)\)", section):
        label = match.group(1).strip()
        if len(label) <= 40:
            recipes.append({"name": label, "page": int(match.group(3)), "book": "RW" if match.group(2) else "AdK"})
    routes = {}
    for key, label, stops in [("touch", "Berührung", ["Einatmung:"]), ("inhale", "Einatmung", ["Verzehr:"]), ("eat", "Verzehr", ["Verarbeitet:", "Preis:"])]:
        value = field(text, label, stops)
        routes[key] = value
    row = {
        "name": name, "page": index,
        "effectTypes": effects.get(squash(name), []),
        "landscape": landscape, "regions": regions,
        "search": search, "searchNote": search_note, "identify": identify, "identifyNote": identify_note,
        "applications": apps, "applicationsNote": apps_note,
        "price": price(field(text, "Preis", ["Rezepte:", "Haltbarkeit:", "Alltagsarzneien"])),
        "recipes": recipes,
        "rawRoutes": [key for key, value in routes.items() if value and not re.match(r"^(keine|–|-)\.?$", value)],
    }
    missing = [k for k in ("landscape", "search", "identify", "applications") if row[k] is None]
    if not row["effectTypes"]:
        missing.append("effectTypes")
    if missing:
        report.append(f"{name} (S. {index}): {', '.join(missing)}")
    rows.append(row)
    if digest and int(digest[0]) <= number <= int(digest[1]):
        knowledge = re.findall(r"QS (1|2|3\+?):\s*(.+?)(?=\n\s*\n|\n\s*QS \d|\n\s*\d{1,3}\s*$|$)", text.split("Was weiß mein Held", 1)[1] if "Was weiß mein Held" in text else "", re.S)
        digests.append(f"### {number}. {name} (S. {index})\n" + "\n".join(f"{k}: {v}" for k, v in routes.items()) +
                       "\nverarbeitet/Rezepte: " + ", ".join(r["name"] for r in recipes) +
                       "\n" + "\n".join(f"QS {q}: {norm(t)}" for q, t in knowledge) + "\n")

with open(out_ts, "w", encoding="utf-8", newline="\n") as handle:
    handle.write("// Generated by scripts/adk_herbs.py from Archiv der Kräuter (AdK S. 11–142, effect types S. 266–270); facts only.\n")
    handle.write("// Do not edit by hand: fix the generator or add corrections in herbCatalog.ts. Summaries live in herbSummaries.ts.\n")
    handle.write("import type { HerbFacts } from './herbTypes'\n\n")
    handle.write("export const herbData: HerbFacts[] = [\n")
    for row in rows:
        handle.write("   " + json.dumps(row, ensure_ascii=False, separators=(", ", ": ")) + ",\n")
    handle.write("]\n")
with open(out_report, "w", encoding="utf-8") as handle:
    handle.write(f"plants: {len(rows)}, gaps: {len(report)}\n" + "\n".join(report) + "\n")
if digest:
    with open(digest[2], "w", encoding="utf-8") as handle:
        handle.write("\n".join(digests))
print(open(out_report, encoding="utf-8").read())
