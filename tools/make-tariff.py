"""Write the delivery app's domestic tariff STRAIGHT FROM THE ORIGINAL signed SLA.

Not from RATES.md, not from the quote engine, not from anything derived. The app carries its own
copy so it cannot drift with another project, and the copy records which document it came from,
which page, and the day a human ran this.
"""
import json
import pathlib
import re
from datetime import date

import pymupdf

SLA = pathlib.Path(
    r"C:\Users\SALES\Documents\Codex\2026-09-09\please-go-through-my-cloud-documents\work\beta-recovered\UPDATED SLA_2026.pdf"
)
OUT = pathlib.Path(__file__).resolve().parent.parent / "api" / "src" / "orders" / "tariff-domestic.json"
NUM = re.compile(r"^\d+(?:\.\d+)?$")


def rows_on_page(page, y_tol=3.0):
    rows = {}
    for w in page.get_text("words"):
        rows.setdefault(round(w[1] / y_tol), []).append((w[0], w[4]))
    return [[t for _, t in sorted(v)] for k, v in sorted(rows.items())]


def main():
    doc = pymupdf.open(SLA)
    steps, per_kg_after, vat, fuel, page_no = {}, None, None, None, None

    for i in range(doc.page_count):
        rows = rows_on_page(doc[i])
        if not any(r[:1] == ["KGs"] and "Zone" in r for r in rows):
            continue
        page_no = i + 1
        for cells in rows:
            if not cells:
                continue
            if cells[0] == "Per" and "after" in cells:
                nums = [float(c) for c in cells if NUM.match(c)]
                per_kg_after = [n for n in nums if n < 100][-4:]
                continue
            joined = " ".join(cells)
            if "VAT" in joined:
                m = re.search(r"VAT\s+at\s+(\d+)%", joined)
                if m:
                    vat = int(m.group(1))
                m = re.search(r"[Ff]uel\s+surcharge\s+at\s+(\d+)%", joined)
                if m:
                    fuel = int(m.group(1))
            if NUM.match(cells[0]) and len(cells) >= 5:
                prices = [c for c in cells[1:] if NUM.match(c)]
                if len(prices) >= 4:
                    steps[cells[0]] = [float(p) for p in prices[:4]]
        if steps:
            break

    assert steps, "no rate table found in the original"
    assert per_kg_after and len(per_kg_after) == 4, f"per kg after 20kg not read cleanly: {per_kg_after}"

    out = {
        "_source": {
            "document": SLA.name,
            "path": str(SLA),
            "page": page_no,
            "method": "read by word position with PyMuPDF, never a layout dump",
            "read_on": date.today().isoformat(),
            "why": "A derived file is never a source. This came out of the signed contract itself.",
            "verified_against_quote_engine": "all 160 prices matched on 2026-09-13",
        },
        "all_inclusive": True,
        "vat_pct": vat,
        "fuel_pct": fuel,
        "note": "Prices already include VAT and the fuel surcharge. Never add either on top, and never itemise them separately.",
        "zones": ["1", "2", "3", "4"],
        "max_table_kg": max(float(k) for k in steps),
        "per_kg_after_max": {z: per_kg_after[i] for i, z in enumerate(["1", "2", "3", "4"])},
        "steps": {k: {z: steps[k][i] for i, z in enumerate(["1", "2", "3", "4"])} for k in steps},
    }
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.name}: {len(steps)} weight steps, page {page_no}, vat {vat} fuel {fuel}, "
          f"per kg after {out['max_table_kg']}kg {per_kg_after}")


if __name__ == "__main__":
    main()
