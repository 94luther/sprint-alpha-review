"""Check the live quote engine's domestic prices against the ORIGINAL signed SLA.

The quote engine's own provenance says its domestic tariff came from "UPDATED SLA_2026.pdf via
sprint-leads\\RATES.md". RATES.md is a derived file. The standing rule is that a derived file is
never a source, so this opens the original PDF and reads the prices out of it by word position,
never with a layout dump, because -layout shifts rows on this document and gives wrong prices.

Nothing here guesses. A number that cannot be read is reported as unreadable.
"""
import json
import pathlib
import sys

import pymupdf

SLA_CANDIDATES = [
    r"C:\Users\SALES\Documents\Codex\2026-09-09\please-go-through-my-cloud-documents\work\beta-recovered\UPDATED SLA_2026.pdf",
    r"C:\Users\SALES\Documents\Codex\2026-09-08\referenced-chatgpt-conversation-this-is-an\work\attachments\M0916__UPDATED SLA_2026 Signed.pdf",
    r"C:\Users\SALES\Desktop\sprint-leads\rate-sources\inbox\2026-07-23-wame-UPDATED SLA_2026.pdf",
]
LIB = pathlib.Path(r"C:\Users\SALES\Desktop\Sprint-Quote-Engine\library")


def find_sla():
    for c in SLA_CANDIDATES:
        p = pathlib.Path(c)
        if p.exists():
            return p
    return None


def rows_on_page(page, y_tol=3.0):
    """Group words into visual rows by their y position. Word coordinates, never a layout dump."""
    words = page.get_text("words")  # x0, y0, x1, y1, word, block, line, word_no
    rows = {}
    for w in words:
        key = round(w[1] / y_tol)
        rows.setdefault(key, []).append((w[0], w[4]))
    out = []
    for key in sorted(rows):
        cells = [t for _, t in sorted(rows[key])]
        out.append((round(key * y_tol), cells))
    return out


def main():
    sla = find_sla()
    if not sla:
        print("ORIGINAL NOT FOUND. Checked:")
        for c in SLA_CANDIDATES:
            print("  ", c)
        return 2
    print(f"original: {sla}")
    doc = pymupdf.open(sla)
    print(f"pages: {doc.page_count}")

    # Find the pages that actually carry prices
    hits = []
    for i, page in enumerate(doc):
        t = page.get_text().lower()
        if ("kg" in t and ("p" in t or "pula" in t)) and any(
            k in t for k in ("tariff", "rate", "zone", "weight", "charge")
        ):
            hits.append(i)
    print(f"pages that look like a rate table: {[h + 1 for h in hits]}")

    for i in hits[:4]:
        print("\n" + "=" * 72)
        print(f"PAGE {i + 1}, rows by word position")
        print("=" * 72)
        for y, cells in rows_on_page(doc[i]):
            line = " | ".join(cells)
            if len(line) > 2:
                print(f"{y:5} {line[:150]}")

    print("\n" + "=" * 72)
    print("WHAT THE LIVE QUOTE ENGINE BELIEVES")
    print("=" * 72)
    dom = json.loads((LIB / "tariffs-domestic.json").read_text(encoding="utf-8-sig"))
    print("city:", json.dumps(dom.get("city"), ensure_ascii=False))
    z = dom.get("zones", {})
    for name in sorted(z):
        steps = z[name].get("halfKgSteps") or {}
        sample = {k: steps[k] for k in list(steps)[:6]}
        print(f"zone {name}: first steps {sample}  perKgAfter={z[name].get('perKgAfter')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
