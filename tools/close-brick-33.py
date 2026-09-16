"""Advance brick 33. The offline half is built; it cannot be laid without a real rider phone."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["33"] = [
    {"type": "file", "path": "api/src/orders/offline.ts", "min_bytes": 4000},
    {"type": "file", "path": "api/src/orders/offline.test.ts", "min_bytes": 3000},
    {"type": "text_contains", "path": "api/src/orders/offline.ts", "pattern": "isPrecious"},
    {"type": "text_contains", "path": "api/src/orders/offline.ts", "pattern": "GIVE_UP_AFTER"},
    # the half that needs a real phone in a real hand
    {"type": "glob", "pattern": "docs/proof/rider_*.jpg", "min_count": 1},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[~] OFFLINE HALF BUILT 13 Sep: api/src/orders/offline.ts. A rider with no signal keeps working "
    "and the phone holds everything. NOTHING IS EVER DROPPED, not when the queue is long, not when the "
    "office refuses it, not after five failed tries; it goes to a pile a person looks at instead. Every "
    "action carries an id made on the phone so sending twice cannot pay twice. Order is kept per order, "
    "so cash never arrives before the handover it belongs to. Handovers and cash are marked so a full "
    "phone can never bin them. The rider who was at the door wins a disagreement, except about dispatch. "
    "13 tests pass, 126 in the suite, and it is driveable in the demo. BLOCKED on a real rider phone for "
    "a real delivery"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 33:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(33)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- The cash cap of P1000,",
    "- Nobody owns buying or providing the rider phones. The offline work assumes a phone with storage that survives a flat battery, and no model, no budget and no owner exists for it anywhere in this plan. Owner: Barbara, and it belongs with the hardware nobody has priced.\n"
    "- The cash cap of P1000,",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [33], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["33"] = [
    "Riders work offline",
    "A rider with no signal still delivers, still takes the cash, still photographs the door, and not one of those facts is ever lost. Most of this country has no coverage.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 06:10)", "# Sprint delivery app — STATE (2026-09-13, 06:55)")
t = t.replace("- 12 laid and verified, 10 in motion", "- 12 laid and verified, 11 in motion")
t = t.replace(
    "113 tests in the API suite.",
    "Brick 33's offline half was built: a rider phone outbox that never drops anything. 126 tests in the API suite.",
)
s.write_text(t, encoding="utf-8")

hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 06:10", "updated 13 September 06:55")
x = x.replace(
    "| 18 | Cash:",
    "| 33 | Offline rider outbox, api/src/orders/offline.ts, 13 tests | Offline half built, blocked on a real rider phone |\n| 18 | Cash:",
)
hf.write_text(x, encoding="utf-8")
print("brick 33 offline half recorded")
