"""Advance brick 20 and checkpoint. It cannot be LAID: the WhatsApp half needs a Meta account."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---- proofs: split the brick honestly. The screen logic is provable now; WhatsApp is not. ----
pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["20"] = [
    {"type": "file", "path": "api/src/orders/tracking.ts", "min_bytes": 4000},
    {"type": "file", "path": "api/src/orders/tracking.test.ts", "min_bytes": 2500},
    {"type": "text_contains", "path": "api/src/orders/tracking.ts", "pattern": "arrivalWindow"},
    {"type": "text_contains", "path": "api/src/orders/tracking.ts", "pattern": "shouldConfirmAddress"},
    # the half that needs a Meta business account and cannot be faked
    {"type": "glob", "pattern": "docs/proof/whatsapp_template_*", "min_count": 1},
    {"type": "glob", "pattern": "docs/proof/whatsapp_update_*", "min_count": 1},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- the wall ----
p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[~] SCREEN HALF BUILT 13 Sep: api/src/orders/tracking.ts puts the arrival WINDOW and the address "
    "check above the map, which is the council ruling written as data so a redesign cannot quietly undo it. "
    "The window WIDENS when an order runs late rather than sliding, and once it is badly late the app says "
    "it does not know instead of guessing. The address is checked once, early, and never for an address a "
    "rider already confirmed. 14 tests, 75 in the suite. BLOCKED on the WhatsApp half: no Meta business "
    "account exists, so no template can be approved and no message can be received on a phone"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 20:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(20)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- Proof at the door is logic and tests only.",
    "- NOBODY HAS OPENED A META BUSINESS ACCOUNT. WhatsApp ordering is called the moat in this plan and sits on the critical path at brick 31, and the tracking updates at brick 20 need it too, yet the account that everything depends on does not exist and nobody owns getting it. This is the biggest unowned item on the wall. Owner: needs Barbara to say who.\n"
    "- Proof at the door is logic and tests only.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [20], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

# ---- house.json ----
h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["20"] = [
    "A window, not a dot",
    "The customer is told a time range and asked once whether the address is right, with the map underneath. A late order widens the window instead of quietly renewing a promise.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- state ----
s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 03:10)", "# Sprint delivery app — STATE (2026-09-13, 03:50)")
t = t.replace("- 10 laid and verified, 9 in motion", "- 10 laid and verified, 10 in motion")
t = t.replace(
    "61 tests in the API suite.",
    "Brick 20's screen half was built too: the arrival window and address check sit above the map, as the council ruled. 75 tests in the API suite.",
)
t = t.replace(
    "## Watch this",
    "## Watch this\n"
    "- NO META BUSINESS ACCOUNT EXISTS. WhatsApp ordering is the moat and is on the critical path at brick 31; the tracking messages at brick 20 need it as well. Nobody owns getting it. This is now the biggest unowned item on the wall and it should go to Barbara with the other names.",
)
s.write_text(t, encoding="utf-8")

# ---- handoff ----
hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 03:10", "updated 13 September 03:50")
x = x.replace(
    "| 21 | **Proof at the door, api/src/orders/handover.ts, 16 tests** | **LAID** |",
    "| 20 | Tracking, api/src/orders/tracking.ts, 14 tests | Screen half built, blocked on a Meta account |\n"
    "| 21 | **Proof at the door, api/src/orders/handover.ts, 16 tests** | **LAID** |",
)
x = x.replace(
    "4. **Snowy sends the insurance** (brick 13).",
    "4. **Somebody opens a Meta business account.** Nothing in this plan has an owner for it, and WhatsApp ordering is called the moat and sits on the critical path at brick 31. Until it exists, brick 20 cannot be finished either. Ask Barbara who owns it.\n"
    "5. **Snowy sends the insurance** (brick 13).",
)
hf.write_text(x, encoding="utf-8")
print("brick 20 advanced, the Meta account gap is now named everywhere")
