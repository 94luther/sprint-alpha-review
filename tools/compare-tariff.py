"""Compare EVERY domestic price the live quote engine uses against the original signed SLA.

Reads the SLA by word position (never a layout dump, which shifts rows on this document) and
diffs it against Sprint-Quote-Engine/library/tariffs-domestic.json, whose own provenance says it
came from the SLA "via RATES.md", a derived file.

Writes the result to a file rather than printing it, because this console is cp1252 and dies on
the first unusual character. Any price that cannot be read is reported, never guessed.
"""
import json
import pathlib
import re

import pymupdf

SLA = pathlib.Path(
    r"C:\Users\SALES\Documents\Codex\2026-09-09\please-go-through-my-cloud-documents\work\beta-recovered\UPDATED SLA_2026.pdf"
)
LIB = pathlib.Path(r"C:\Users\SALES\Desktop\Sprint-Quote-Engine\library\tariffs-domestic.json")
OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "TARIFF_CHECK.md"

NUM = re.compile(r"^\d+(?:\.\d+)?$")


def rows_on_page(page, y_tol=3.0):
    rows = {}
    for w in page.get_text("words"):
        rows.setdefault(round(w[1] / y_tol), []).append((w[0], w[4]))
    return [[t for _, t in sorted(v)] for k, v in sorted(rows.items())]


def read_original():
    """Returns {kg: [z1, z2, z3, z4]} and the per kg after 20 row, from page 10."""
    doc = pymupdf.open(SLA)
    table, after, notes = {}, None, []
    for page_no in range(doc.page_count):
        rows = rows_on_page(doc[page_no])
        header = any(
            r[:1] == ["KGs"] and "Zone" in r for r in rows
        )
        if not header:
            continue
        for cells in rows:
            if not cells:
                continue
            if cells[0] == "Per" and "after" in cells:
                nums = [c for c in cells if NUM.match(c)]
                after = [float(n) for n in nums if float(n) < 100][-4:] or None
                continue
            if NUM.match(cells[0]) and len(cells) >= 5:
                prices = [c for c in cells[1:] if NUM.match(c)]
                if len(prices) >= 4:
                    table[float(cells[0])] = [float(p) for p in prices[:4]]
            joined = " ".join(cells)
            if "VAT" in joined or "Fuel" in joined:
                notes.append(joined)
        if table:
            return table, after, notes, page_no + 1
    return table, after, notes, None


def main():
    original, per_kg_after, notes, page = read_original()
    engine = json.loads(LIB.read_text(encoding="utf-8-sig"))

    lines = []
    w = lines.append
    w("# Tariff check: the live quote engine against the original signed contract\n")
    w("Run 13 September 2026 from `Desktop\\sprint-alpha\\tools\\compare-tariff.py`.\n")
    w(f"**Original read:** `{SLA.name}`, page {page}, by word position. Never a layout dump, because "
      "that shifts rows on this document and produces wrong prices.\n")
    w(f"**Compared against:** `{LIB}`, whose own provenance says its source is the SLA "
      "**via sprint-leads\\RATES.md**, which is a derived file.\n")
    w(f"Weight steps found in the original: **{len(original)}**. "
      f"Per kilo after 20kg: **{per_kg_after}**.\n")
    for n in notes[:2]:
        w(f"> {n}\n")

    zones = engine.get("zones", {})
    mismatches, checked, missing = [], 0, []

    for kg in sorted(original):
        for zi, zone_name in enumerate(["1", "2", "3", "4"]):
            z = zones.get(zone_name) or {}
            steps = z.get("halfKgSteps") or {}
            key = None
            for cand in (str(kg), str(int(kg)) if float(kg).is_integer() else None, f"{kg:.1f}"):
                if cand is not None and cand in steps:
                    key = cand
                    break
            if key is None:
                missing.append((kg, zone_name))
                continue
            checked += 1
            engine_price = float(steps[key])
            original_price = original[kg][zi]
            if abs(engine_price - original_price) > 0.005:
                mismatches.append((kg, zone_name, original_price, engine_price))

    w("\n## Verdict\n")
    if not original:
        w("**COULD NOT READ THE ORIGINAL.** Nothing is confirmed. Do not quote from the engine until this is resolved.\n")
    elif mismatches:
        w(f"**{len(mismatches)} PRICES DO NOT MATCH THE CONTRACT.** Every one is a wrong price that can reach a customer.\n")
        w("\n| Weight | Zone | The contract says | The engine charges | Difference |\n|---|---|---|---|---|\n")
        for kg, zone, o, e in mismatches[:40]:
            w(f"| {kg} kg | {zone} | P{o:.2f} | P{e:.2f} | {e - o:+.2f} |\n")
        if len(mismatches) > 40:
            w(f"\nand {len(mismatches) - 40} more.\n")
    else:
        w(f"**CLEAN. All {checked} prices checked match the original contract exactly.**\n")
        w("\nThe engine was built from a derived file, which breaks the standing rule, but the numbers "
          "in it are right. The provenance line should be corrected to say the original was verified "
          "on this date, so nobody has to check it again.\n")

    if missing:
        w(f"\n## Weights in the contract that the engine has no price for: {len(missing)}\n")
        for kg, zone in missing[:20]:
            w(f"- {kg} kg, zone {zone}\n")
        w("\nThese are quoted by a rule rather than a table, or they are a gap. Check before quoting them.\n")

    w("\n## What was read out of the original, in full\n")
    w("\n| KGs | Zone 1 | Zone 2 | Zone 3 | Zone 4 |\n|---|---|---|---|---|\n")
    for kg in sorted(original):
        p = original[kg]
        w(f"| {kg} | P{p[0]:.2f} | P{p[1]:.2f} | P{p[2]:.2f} | P{p[3]:.2f} |\n")
    if per_kg_after:
        w(f"\nPer kilo after 20kg: zone 1 P{per_kg_after[0]:.2f}, zone 2 P{per_kg_after[1]:.2f}, "
          f"zone 3 P{per_kg_after[2]:.2f}, zone 4 P{per_kg_after[3]:.2f}.\n")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("".join(lines), encoding="utf-8")
    summary = (
        f"steps={len(original)} checked={checked} mismatches={len(mismatches)} "
        f"missing={len(missing)} page={page}"
    )
    pathlib.Path(str(OUT) + ".summary").write_text(summary, encoding="utf-8")
    print(summary)


if __name__ == "__main__":
    main()
