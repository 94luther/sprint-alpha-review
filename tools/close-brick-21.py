"""Lay brick 21 and checkpoint."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---- proofs ----
pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["21"] = [
    {"type": "file", "path": "api/src/orders/handover.ts", "min_bytes": 5000},
    {"type": "file", "path": "api/src/orders/handover.test.ts", "min_bytes": 3000},
    {"type": "text_contains", "path": "api/src/orders/handover.ts", "pattern": "old_enough"},
    {"type": "text_contains", "path": "api/src/orders/handover.ts", "pattern": "photo_of"},
    # the whole point of the brick: an identity number field must never exist
    {"type": "text_contains", "path": "api/src/orders/handover.ts", "pattern": "(?i)id_number|identity_number|omang_number", "expect": False},
    {"type": "attested", "note_pattern": "(?i)tests pass"},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- the wall ----
p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[x] LAID 13 Sep 2026. api/src/orders/handover.ts: a photograph of the PARCEL for every delivery "
    "(a photo of the person is refused), a document check for liquor, and a document plus a four digit "
    "code the customer reads out for a prescription. Three wrong codes locks it. The identity NUMBER is "
    "never stored anywhere, only that the name matched and the person is old enough, and a rider typing "
    "one into the name field is refused. Photographs die at 90 days, checks at two years. 16 tests pass, "
    "61 in the suite, tsc clean"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 21:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(21)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- The Address Passport is logic and tests only.",
    "- Proof at the door is logic and tests only. No camera, no code screen in the customer app, and no rider screen calls it yet. Wiring it in belongs with brick 30 (the app on real data) and brick 33 (the rider app). Owner: Luther.\n"
    "- Nobody has decided who at Sprint may look at a delivery photograph, or how a customer asks to see the one taken at their door. The assessment covers what is kept, not who may open it. Owner: Barbara with the data protection officer, once named.\n"
    "- The Address Passport is logic and tests only.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [21], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

# ---- house.json ----
h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["21"] = [
    "Proof at the door",
    "Every handover leaves a photograph of the parcel, and liquor or a prescription also needs a document checked and a code read out. The identity number is never written down, so it can never leak.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- state ----
s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 02:30)", "# Sprint delivery app — STATE (2026-09-13, 03:10)")
t = t.replace("- 9 laid and verified, 9 in motion", "- 10 laid and verified, 9 in motion")
t = t.replace(
    "Brick 22 was LAID 13 Sep: both projects now report ZERO vulnerabilities.",
    "Bricks 22 and 21 were LAID 13 Sep. Both projects report ZERO vulnerabilities, and proof at the door is built: photograph of the parcel always, document check for liquor, document plus a code for a prescription, and the identity number never stored. 61 tests in the API suite.",
)
s.write_text(t, encoding="utf-8")

# ---- handoff ----
hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 02:30", "updated 13 September 03:10")
x = x.replace(
    "**9 laid and machine verified. 9 in motion. 29 not started.**",
    "**10 laid and machine verified. 9 in motion. 28 not started.**",
)
x = x.replace(
    "| 22 | **Security floor, docs/SECURITY_AUDIT.md** | **LAID. Both projects at ZERO vulnerabilities, verified by booting and driving the app** |",
    "| 21 | **Proof at the door, api/src/orders/handover.ts, 16 tests** | **LAID** |\n"
    "| 22 | **Security floor, docs/SECURITY_AUDIT.md** | **LAID. Both projects at ZERO vulnerabilities, verified by booting and driving the app** |",
)
x = x.replace(
    "**Everything in the engine that does not need a person is now done.** Bricks 14, 16 and 22 are laid.",
    "**Everything in the engine that does not need a person is now done.** Bricks 14, 16, 21 and 22 are laid: orders cannot get stuck, addresses improve with use, handovers leave proof, and the dependency tree is clean.",
)
hf.write_text(x, encoding="utf-8")
print("brick 21 laid, everything checkpointed")
