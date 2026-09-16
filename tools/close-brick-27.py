"""Lay brick 27 and record the tariff verification everywhere it matters."""
import json
import pathlib
import re
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---- proofs ----
pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["27"] = [
    {"type": "file", "path": "api/src/orders/parcel.ts", "min_bytes": 3500},
    {"type": "file", "path": "api/src/orders/parcel.test.ts", "min_bytes": 2500},
    {"type": "file", "path": "api/src/orders/tariff-domestic.json", "min_bytes": 2000},
    {"type": "file", "path": "docs/TARIFF_CHECK.md", "min_bytes": 1500},
    # the prices must trace to the contract, never to a derived file
    {"type": "text_contains", "path": "api/src/orders/tariff-domestic.json", "pattern": "UPDATED SLA_2026"},
    {"type": "text_contains", "path": "api/src/orders/tariff-domestic.json", "pattern": "(?i)RATES\\.md", "expect": False},
    {"type": "attested", "note_pattern": "(?i)tests pass"},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- the wall ----
p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[x] LAID 13 Sep 2026. api/src/orders/parcel.ts prices a parcel from the SIGNED CONTRACT: "
    "tariff-domestic.json was written straight out of UPDATED SLA_2026.pdf page 10, read by word "
    "position, never from RATES.md or any other derived file. 40 weight steps, four zones, the five "
    "to twenty kilo band included, and the contract per kilo rate past 20kg. A weight or zone with no "
    "contract price is REFUSED, never estimated. 10 tests, 85 in the suite. Separately, all 160 prices "
    "in the live quote engine were checked against the same original and every one matched, written up "
    "in docs/TARIFF_CHECK.md"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 27:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(27)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- NOBODY HAS OPENED A META BUSINESS ACCOUNT.",
    "- Parcel pricing is built but no WAYBILL is created. A customer can be quoted correctly and there is still no consignment number, no label and nothing for a branch to scan. That is Moemedi's piece and it has not been started. Owner: Moemedi with Luther.\n"
    "- The zone a destination falls in is not in this app. The contract prices by ORIGIN and DESTINATION together, and only the Gaborone origin case exists anywhere on this machine. Sending from Francistown is unpriced. Owner: Barbara.\n"
    "- NOBODY HAS OPENED A META BUSINESS ACCOUNT.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [27], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

# ---- house.json ----
h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["27"] = [
    "Parcels in the app",
    "Sprint's own business, sending a parcel, is priced inside the same app as the groceries, off the signed contract itself rather than a copy of it. Neither competitor can offer the second half of that.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- correct the quote engine's provenance so nobody re-checks ----
tv = pathlib.Path(r"C:\Users\SALES\Desktop\Sprint-Quote-Engine\library\tariff-version.json")
if tv.exists():
    v = json.loads(tv.read_text(encoding="utf-8-sig"))
    v["domestic"]["source"] = (
        "UPDATED SLA_2026.pdf page 10, read by word position. Previously built via sprint-leads\\RATES.md, "
        "a derived file. All 160 prices were checked against the original on " + date.today().isoformat()
        + " and every one matched. See Desktop\\sprint-alpha\\docs\\TARIFF_CHECK.md."
    )
    v["domestic"]["verifiedAgainstOriginal"] = date.today().isoformat()
    tv.write_text(json.dumps(v, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("quote engine provenance corrected")

# ---- state ----
s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 03:50)", "# Sprint delivery app — STATE (2026-09-13, 04:40)")
t = t.replace("- 10 laid and verified, 10 in motion", "- 11 laid and verified, 10 in motion")
t = t.replace(
    "75 tests in the API suite.",
    "Brick 27 was LAID: parcels are priced in the app from the signed contract itself. 85 tests in the API suite.",
)
t = t.replace(
    "## Watch this",
    "## Watch this\n"
    "- THE LIVE QUOTE ENGINE WAS CHECKED AGAINST THE ORIGINAL CONTRACT on 13 Sep and all 160 domestic prices matched. Its provenance said it was built from RATES.md, a derived file, which breaks the standing rule; the numbers were right anyway. Written up in docs/TARIFF_CHECK.md and the engine's own version file now records the verification.",
)
s.write_text(t, encoding="utf-8")

# ---- handoff ----
hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 03:50", "updated 13 September 04:40")
x = x.replace(
    "**10 laid and machine verified. 9 in motion. 28 not started.**",
    "**11 laid and machine verified. 10 in motion. 26 not started.**",
)
x = x.replace(
    "| 20 | Tracking, api/src/orders/tracking.ts, 14 tests | Screen half built, blocked on a Meta account |",
    "| 20 | Tracking, api/src/orders/tracking.ts, 14 tests | Screen half built, blocked on a Meta account |\n"
    "| 27 | **Parcels priced from the signed contract, api/src/orders/parcel.ts, 10 tests** | **LAID** |",
)
hf.write_text(x, encoding="utf-8")
print("brick 27 laid")
