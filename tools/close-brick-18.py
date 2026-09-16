"""Advance brick 18. The cash half is built; mobile money still waits on the merchant rates."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["18"] = [
    {"type": "file", "path": "api/src/orders/cash.ts", "min_bytes": 3500},
    {"type": "file", "path": "api/src/orders/cash.test.ts", "min_bytes": 2500},
    {"type": "text_contains", "path": "api/src/orders/cash.ts", "pattern": "reconcile"},
    {"type": "text_contains", "path": "api/src/orders/cash.ts", "pattern": "CASH_CAP_THEBE"},
    # the mobile money half, which cannot start until the rates arrive
    {"type": "glob", "pattern": "docs/proof/smega_sandbox_*", "min_count": 1},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[~] CASH HALF BUILT 13 Sep: api/src/orders/cash.ts. A cap so no rider carries more than "
    "P1000 of anyone else's money, the note the customer will pay with asked at checkout so the "
    "rider leaves with the right change, a float worked out from the orders actually on the run "
    "with a supervisor signature over P500, and an END OF SHIFT COUNT against what the orders say "
    "should be there. That count is the number nobody at Sprint has ever measured, and it is the "
    "only way the cash leak becomes visible. Money is held in thebe, never a decimal. 13 tests pass, "
    "98 in the suite. BLOCKED on mobile money: the merchant rates were asked of Orange, Mascom and "
    "BTC on Mon 14 Sep and none has answered"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 18:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(18)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- Parcel pricing is built but no WAYBILL is created.",
    "- The cash cap of P1000, the supervisor threshold of P500 and the P5 write off are MY numbers, not Sprint's. They are the sort of figure only finance can set, and they are three of the numbers already asked of Barbara in the fault model. Until she sets them the code works but the thresholds are a guess. Owner: Barbara with finance.\n"
    "- Nobody has ever measured Sprint's own cash loss. The industry figure of one and a half to three percent is what this plan quotes, and it is somebody else's number. The reconciliation built today is what would produce Sprint's real one, from the first day of the pilot. Owner: Luther to report it at week one.\n"
    "- Parcel pricing is built but no WAYBILL is created.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [18], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["18"] = [
    "Cash that counts",
    "A rider leaves with the exact change the orders need and counts it back at the end of the shift against what should be there. The difference is named rather than absorbed, which is how the cash leak finally becomes a number.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 04:40)", "# Sprint delivery app — STATE (2026-09-13, 05:20)")
t = t.replace(
    "Brick 27 was LAID: parcels are priced in the app from the signed contract itself. 85 tests in the API suite.",
    "Brick 27 was LAID: parcels are priced in the app from the signed contract itself. Brick 18's cash half was built: cap, change, float and an end of shift count. 98 tests in the API suite.",
)
s.write_text(t, encoding="utf-8")

hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 04:40", "updated 13 September 05:20")
x = x.replace(
    "| 27 | **Parcels priced from the signed contract, api/src/orders/parcel.ts, 10 tests** | **LAID** |",
    "| 18 | Cash: cap, change, float, end of shift count, api/src/orders/cash.ts, 13 tests | Cash half built, blocked on the mobile money rates |\n"
    "| 27 | **Parcels priced from the signed contract, api/src/orders/parcel.ts, 10 tests** | **LAID** |",
)
x = x.replace(
    "2. **The mobile money rates arrive** (brick 10).",
    "2. **The mobile money rates arrive** (brick 10). The cash half of brick 18 is already built and waiting.",
)
hf.write_text(x, encoding="utf-8")
print("brick 18 cash half recorded")
