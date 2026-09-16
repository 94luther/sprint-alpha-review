"""Lay brick 34 and checkpoint the three brick run."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["34"] = [
    {"type": "file", "path": "api/src/orders/ops.ts", "min_bytes": 4500},
    {"type": "file", "path": "api/src/orders/ops.test.ts", "min_bytes": 3000},
    {"type": "text_contains", "path": "api/src/orders/ops.ts", "pattern": "theOneThing"},
    {"type": "text_contains", "path": "api/src/orders/ops.ts", "pattern": "perMerchant"},
    {"type": "text_contains", "path": "demo/index.html", "pattern": "The ops tower"},
    {"type": "attested", "note_pattern": "(?i)tests pass"},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[x] LAID 13 Sep 2026. api/src/orders/ops.ts answers the director sweep from the orders "
    "themselves: what is stuck worst first and who has it, output PER RIDER by name with failures "
    "split by whose fault so a rider taking hard addresses is not punished for other people's "
    "failures, margin PER MERCHANT with the shop quietly costing money at the top, and the leak "
    "broken down by whose fault it was. It leads with ONE thing to do now, naming an order, a person "
    "and a place, because a board that opens with revenue teaches people to scroll past the order "
    "sitting for an hour. 11 tests pass, 178 in the suite, and the whole board is live in the demo"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 34:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(34)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- THE \"55 BRANCHES\" FIGURE IS NOT SOURCED.",
    "- The ops tower computes from orders, and no order has a LOCATION on it, because no Sprint site has coordinates anywhere on this machine. So the board can say what is stuck and who has it, and cannot yet draw where anybody is. The live map in this brick's name is not built and cannot be until the network is geocoded. Owner: Luther with the unnamed IT lead.\n"
    "- THE \"55 BRANCHES\" FIGURE IS NOT SOURCED.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [34], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["34"] = [
    "Tower sees all",
    "One screen says what is stuck and who has it, output per rider by name, and which shop is quietly costing money. It opens with the one thing to do now, not with a total.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 07:40)", "# Sprint delivery app — STATE (2026-09-13, 09:15)")
t = t.replace("- 12 laid and verified, 12 in motion", "- 15 laid and verified, 11 in motion")
t = t.replace(
    "138 tests in the API suite.",
    "Bricks 17, 19 and 34 were worked in one careful run: the REAL network read out of the company profile (53 sites), the settlement engine that turns fault into a day's payout, and the ops tower answering the director sweep. 178 tests in the API suite.",
)
s.write_text(t, encoding="utf-8")

hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 07:40", "updated 13 September 09:15")
x = x.replace(
    "| 26 | Liquor by the merchant licence,",
    "| 17 | **The real Sprint network, 53 sites, api/src/orders/network.ts, 13 tests** | **LAID** |\n"
    "| 19 | Settlement engine, api/src/orders/settlement.ts, 16 tests | Built, NOT PAYABLE until Barbara agrees the fault model |\n"
    "| 34 | **The ops tower, api/src/orders/ops.ts, 11 tests** | **LAID** |\n"
    "| 26 | Liquor by the merchant licence,",
)
hf.write_text(x, encoding="utf-8")
print("brick 34 laid, three brick run checkpointed")
