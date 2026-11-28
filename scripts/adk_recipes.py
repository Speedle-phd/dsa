"""Generate server/src/utils/herbs/recipeData.ts (facts only) from the local Archiv der Kräuter PDF.

Usage (repo root):
    python scripts/adk_recipes.py Archiv_der_Kraeuter.pdf server/src/utils/herbs/recipeData.ts report.txt
    python scripts/adk_recipes.py Archiv_der_Kraeuter.pdf server/src/utils/herbs/recipeData.ts report.txt --digest 1 20 digest.txt
The recipe chapter (AdK S. 145–178) has no bookmarks: a recipe starts at a short line followed by a line of effect-type
icons (whitespace only in the text layer). Only facts are written (values, ingredient names, prices); descriptions,
effects and Qualitätsstufen go to the digest as input for the summaries in recipeSummaries.ts; keep it out of git.
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

FIRST, LAST = 145, 178
# Section headings in book order and the kind they start (S. 145, 152, 154, 159, 172, 175)
SECTIONS = {
    "Pflanzliche Hilfsmittel": "hilfsmittel",
    "Pflanzliche Gifte": "gift",
    "Pflanzliche Rauschmittel": "rauschmittel",
    "Elixiere": "elixier",
    "Alchimistische Gifte": "alchimistischesGift",
    "Alchimistische Rauschmittel": "alchimistischesRauschmittel",
}
LEGEND = {"Heilung", "Nützlich", "Gift", "Wehrhaft", "Physische", "Wirkung", "Übernatürlich", "Psychische", "Rezepte"}
# Labels in the order they may appear; a value runs until the next label
LABELS = [
    "Alternative Namen", "Alternativer Name", "Alternative Name", "Alternativnamen",
    "Stufe", "Art", "Widerstand", "Einnahme", "Wirkung", "Nebenwirkung", "Überdosierung", "Beginn", "Dauer", "Legalität",
    "Wert/Preis", "Sucht", "Wahn", "Zutaten", "Typische Hilfsmittel", "Verarbeitungsschwierigkeit", "Typische Ingredienzien",
    "Kosten der Ingredienzienstufe", "Labor", "Brauschwierigkeit", "Voraussetzungen (Brauvorgang)", "AP-Wert (Berufsgeheimnis)",
    "Besonderheiten", "Besonderheit", "Qualitätsstufen", "Kampftechnik", "Leiteigenschaft", "Steigerungsfaktor", "Kosten",
    "Waffenvorteil", "Waffennachteil", "Rüstungsvorteil", "Rüstungsnachteil",
]
ALIAS_LABELS = {"Alternative Namen", "Alternativer Name", "Alternative Name", "Alternativnamen"}
LABEL_RE = re.compile(r"^(" + "|".join(re.escape(label) for label in sorted(LABELS, key=len, reverse=True)) + r"):\s*(.*)$")
# Text that is not a fact: summarised by hand
PROSE = {"Wirkung", "Nebenwirkung", "Überdosierung", "Besonderheiten", "Besonderheit", "Qualitätsstufen", "Sucht", "Wahn", "Einnahme",
         "Waffenvorteil", "Waffennachteil", "Rüstungsvorteil", "Rüstungsnachteil"}

report = []


def page_lines(page):
    text = reader.pages[page].extract_text() or ""
    lines = text.replace("\xad", "").split("\n")
    # running head and folio
    while lines and lines[0].strip() in ("Rezepte", ""):
        lines.pop(0)
    while lines and (lines[-1].strip() == "" or lines[-1].strip() == str(page)):
        lines.pop()
    return lines


def join(parts):
    text = ""
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if re.search(r"\s?-$", text) and part[:1].islower():
            text = re.sub(r"\s?-$", "", text) + part
        elif re.search(r"\s–$", text) and part[:1].islower():
            text = text[:-2] + part
        else:
            text = f"{text} {part}" if text else part
    return " ".join(text.split())


# Sidebars printed inside a recipe (an optional rule and weapon tables on S. 145 and 151): the text from these starts is dropped
# (weapon and armour tables of products such as Blasrohr or Menchal-Rüstung start with "Name "; their title line before stays)
SIDEBARS = ("Ungewohnter Einsatz", "Name ")
PAGE_BREAK = "<<page break>>"
# Headings printed without an effect-type icon line (S. 171)
PLAIN_HEADINGS = {"Wachtrunk"}


def normalise(lines):
    """Join labels split by hyphenation ("Kosten der Ingredienzien-" / "stufe: 30 ...") and split labels that follow a sentence."""
    out = []
    for line in lines:
        clean = line.strip()
        # "Qualitätsstufen" printed without its colon (Kaltes Licht, S. 165)
        if clean == "Qualitätsstufen":
            clean = "Qualitätsstufen:"
        # "Wirkung*:" with a footnote (Lotosöl, S. 174); the footnote itself follows the price
        clean = re.sub(r"^Wirkung\*:", "Wirkung:", clean)
        if out and re.search(r"-\s*$", out[-1]) and LABEL_RE.match(re.sub(r"\s*-\s*$", "", out[-1]) + clean):
            out[-1] = re.sub(r"\s*-\s*$", "", out[-1]) + clean
            continue
        parts = re.split(r"(?<=[.!]) (?=(?:" + "|".join(re.escape(label) for label in LABELS) + r"):)", clean)
        out.extend(parts)
    return out


# ---- split the chapter into recipes
recipes = []
kind = None
current = None
for page in range(FIRST, LAST + 1):
    lines = page_lines(page)
    for index, line in enumerate(lines):
        clean = line.strip()
        if clean in SECTIONS:
            kind = SECTIONS[clean]
            continue
        nxt = lines[index + 1] if index + 1 < len(lines) else None
        heading = clean in PLAIN_HEADINGS or (clean and nxt is not None and nxt != "" and nxt.strip() == "" and len(clean) < 45
                   and not clean.endswith(":") and not clean.endswith(".") and not LABEL_RE.match(clean) and kind)
        if heading and not (page == 158 and kind == "rauschmittel" and current and current["name"] == "Schwarzer Wein" and clean != "Schwarzer Wein"):
            current = {"name": clean, "page": page, "kind": kind, "lines": []}
            recipes.append(current)
            continue
        if current and clean not in LEGEND:
            current["lines"].append(clean)
    if current:
        current["lines"].append(PAGE_BREAK)

# The general rules of S. 158 (Alchimistische Rezepte) follow Schwarzer Wein on the same page: cut them off
for recipe in recipes:
    if recipe["name"] == "Schwarzer Wein":
        cut = next((i for i, line in enumerate(recipe["lines"]) if line.startswith("Alchimistische Rezepte")), None)
        if cut is not None:
            recipe["lines"] = recipe["lines"][:cut]
for recipe in recipes:
    recipe["lines"] = normalise(recipe["lines"])
    # A sidebar runs to the end of its page; the recipe may continue on the next page
    kept, skipping = [], None
    for line in recipe["lines"]:
        if line == PAGE_BREAK:
            if skipping:
                report.append(f"{recipe['name']}: dropped sidebar from '{skipping}'")
            skipping = None
            continue
        start = next((prefix for prefix in SIDEBARS if line.startswith(prefix)), None)
        if start:
            skipping = start
        if not skipping:
            kept.append(line)
    recipe["lines"] = kept

# ---- fields
def fields_of(recipe):
    intro, values, label = [], {}, None
    lines = [line for line in recipe["lines"] if line != PAGE_BREAK]
    for index, line in enumerate(lines):
        following = lines[index + 1] if index + 1 < len(lines) else ""
        alias_goes_on = line.rstrip().endswith(",") or following.startswith("(")
        if label is None and values and list(values)[-1] in ALIAS_LABELS and line.startswith("(") and not intro:
            # "(Mittelaventurien) Das aus ..." : the region of the last alias, then the description
            region, _, rest = line.partition(")")
            values[list(values)[-1]].append(region + ")")
            line = rest.strip()
            if not line:
                continue
        match = LABEL_RE.match(line)
        if match:
            label = match.group(1)
            values.setdefault(label, []).append(match.group(2))
            if label in ALIAS_LABELS and not alias_goes_on:
                label = None
        elif label:
            values[label].append(line)
            if label in ALIAS_LABELS and not alias_goes_on:
                label = None
        else:
            intro.append(line)
    return join(intro), {key: join(parts) for key, parts in values.items()}


def modifier(value, name, label):
    if value is None:
        return None
    clean = value.replace("–", "-").replace("−", "-").replace(" ", "")
    if clean.startswith("+/-0") or clean.startswith("±0") or clean == "0":
        return 0
    match = re.match(r"^([+-]\d+)", clean)
    if not match:
        report.append(f"{name}: {label} '{value}' not read")
        return None
    return int(match.group(1))


def number(pattern, value, name, label):
    if value is None:
        return None
    match = re.search(pattern, value.replace(".", ""))
    if not match:
        report.append(f"{name}: {label} '{value}' not read")
        return None
    return int(match.group(1))


def split_list(value):
    if not value:
        return []
    items, depth, current = [], 0, ""
    for char in value:
        depth += char == "("
        depth -= char == ")"
        if char == "," and depth == 0:
            items.append(current)
            current = ""
        else:
            current += char
    items.append(current)
    return [" ".join(item.split()) for item in items if item.strip()]


def laboratory(value, name):
    if value is None:
        return None
    lower = value.lower()
    if "alchimist" in lower:
        return "Alchemistenlabor"
    if "hexenküche" in lower:
        return "Hexenküche"
    if "archaisch" in lower:
        return "Archaisches Labor"
    report.append(f"{name}: Labor '{value}' not read")
    return None


rows = []
digest_rows = []
for recipe in recipes:
    name = recipe["name"]
    intro, values = fields_of(recipe)
    get = values.get
    row = {"name": name, "page": recipe["page"], "kind": recipe["kind"]}
    alias = get("Alternative Namen") or get("Alternativer Name") or get("Alternative Name") or get("Alternativnamen")
    row["aliases"] = split_list(alias)
    if recipe["kind"] in ("hilfsmittel", "gift", "rauschmittel"):
        row["ingredients"] = get("Zutaten")
        row["tools"] = get("Typische Hilfsmittel")
        row["processing"] = modifier(get("Verarbeitungsschwierigkeit"), name, "Verarbeitungsschwierigkeit")
    else:
        row["ingredients"] = get("Typische Ingredienzien")
        row["costPerLevel"] = number(r"(\d+)", get("Kosten der Ingredienzienstufe"), name, "Kosten der Ingredienzienstufe")
        row["laboratory"] = laboratory(get("Labor"), name)
        row["difficulty"] = modifier(get("Brauschwierigkeit"), name, "Brauschwierigkeit")
        row["brewPrerequisites"] = get("Voraussetzungen (Brauvorgang)")
        ap = get("AP-Wert (Berufsgeheimnis)")
        row["secretAp"] = number(r"(\d+)\s*AP", ap, name, "AP-Wert")
        prerequisite = re.search(r"\(Voraussetzung(?:en)?:\s*([^)]*)\)", ap or "")
        row["secretPrerequisite"] = " ".join(prerequisite.group(1).split()) if prerequisite else None
    if get("Stufe") is not None or get("Art") is not None:
        row["poison"] = {
            # Alchimistische Gifte/Rauschmittel: the level equals the QS of the brew
            "level": "QS" if (get("Stufe") or "").strip() == "QS" else number(r"(\d+)", get("Stufe"), name, "Stufe"),
            "type": get("Art"),
            "resistance": get("Widerstand"),
            "onset": get("Beginn"),
            "duration": get("Dauer"),
        }
    if get("Legalität") is not None:
        row["legality"] = get("Legalität")
    if get("Wert/Preis") is not None or get("Kosten") is not None:
        # a footnote "*) …" printed after the price belongs to the effect (Lotosöl, S. 174): kept out of the price
        row["valuePrice"] = re.split(r"\s*\*\)", get("Wert/Preis") or get("Kosten"))[0]
    if recipe["kind"] in ("hilfsmittel",) and get("Wert/Preis") is None:
        pass
    for label in values:
        if label not in PROSE and label not in {"Alternative Namen", "Alternativer Name", "Alternative Name", "Alternativnamen", "Stufe", "Art", "Widerstand",
                                                "Beginn", "Dauer", "Legalität", "Wert/Preis", "Zutaten", "Typische Hilfsmittel", "Verarbeitungsschwierigkeit",
                                                "Typische Ingredienzien", "Kosten der Ingredienzienstufe", "Labor", "Brauschwierigkeit",
                                                "Voraussetzungen (Brauvorgang)", "AP-Wert (Berufsgeheimnis)", "Kosten"}:
            report.append(f"{name}: extra field {label}: {values[label][:80]}")
    expected = ["Zutaten", "Verarbeitungsschwierigkeit"] if recipe["kind"] == "hilfsmittel" else \
        ["Stufe", "Art", "Widerstand", "Beginn", "Dauer"] if recipe["kind"] in ("gift", "rauschmittel") else \
        ["Typische Ingredienzien", "Kosten der Ingredienzienstufe", "Labor", "Brauschwierigkeit", "AP-Wert (Berufsgeheimnis)"]
    for label in expected:
        if get(label) is None:
            report.append(f"{name}: missing {label}")
    repeated = sorted({label for label in values if sum(1 for line in recipe["lines"] if line.startswith(label + ":")) > 1})
    if repeated:
        report.append(f"{name}: labels repeated (a heading without icons?): {', '.join(repeated)}")
    rows.append(row)
    prose = {label: values[label] for label in values if label in PROSE}
    digest_rows.append((name, recipe["page"], recipe["kind"], intro, prose))

with open(out_ts, "w", encoding="utf-8", newline="\n") as handle:
    handle.write("// Generated by scripts/adk_recipes.py from Archiv der Kräuter (AdK S. 145–177); facts only.\n")
    handle.write("// Do not edit by hand: fix the generator or add corrections in recipeCatalog.ts. Summaries live in recipeSummaries.ts.\n")
    handle.write("import type { RecipeFacts } from './recipeTypes'\n\n")
    handle.write("export const recipeData: RecipeFacts[] = [\n")
    for row in rows:
        handle.write("   " + json.dumps(row, ensure_ascii=False) + ",\n")
    handle.write("]\n")

counts = {}
for row in rows:
    counts[row["kind"]] = counts.get(row["kind"], 0) + 1
with open(out_report, "w", encoding="utf-8") as handle:
    handle.write(f"{len(rows)} recipes: {counts}\n")
    handle.write("\n".join(report) + "\n")
print(f"{len(rows)} recipes {counts}, {len(report)} report lines")

if digest:
    first, last, path = int(digest[0]), int(digest[1]), digest[2]
    with open(path, "w", encoding="utf-8") as handle:
        for number_, (name, page, kind_, intro, prose) in enumerate(digest_rows, start=1):
            if first <= number_ <= last:
                handle.write(f"## {number_}. {name} (S. {page}, {kind_})\n{intro}\n")
                for label, text in prose.items():
                    handle.write(f"- {label}: {text}\n")
                handle.write("\n")
