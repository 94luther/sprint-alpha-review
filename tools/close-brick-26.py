"""Advance brick 26. The rule engine is built; it needs a real merchant licence to be laid."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))
d["26"] = [
    {"type": "file", "path": "api/src/orders/liquor.ts", "min_bytes": 4000},
    {"type": "file", "path": "api/src/orders/liquor.test.ts", "min_bytes": 3000},
    {"type": "text_contains", "path": "api/src/orders/liquor.ts", "pattern": "mayHandOver"},
    {"type": "text_contains", "path": "api/src/orders/liquor.ts", "pattern": "EXPIRY_WARNING_DAYS"},
    # no national trading hours are hard coded anywhere, and the truth test keeps it that way
    {"type": "text_contains", "path": "api/src/orders/liquor.ts", "pattern": "(?i)NATIONAL_HOURS|DEFAULT_HOURS", "expect": False},
    # the half that needs a real merchant
    {"type": "glob", "pattern": "docs/merchants/liquor_licence_*", "min_count": 1},
]
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[~] RULE ENGINE BUILT 13 Sep: api/src/orders/liquor.ts. The app does NOT hard code any trading "
    "hour. Botswana's Trade Act repealed the old Trade and Liquor Act and the statute that replaced it "
    "is not on this machine, so an invented hour would be an offence waiting to happen. Instead each "
    "merchant's OWN licence is the rule: its permitted hours per day, its expiry, its number. No licence "
    "on file means no liquor moves, and that is the default rather than a switch somebody remembers. "
    "The check runs against when the order will ARRIVE, not when it was placed, because a customer "
    "ordering at 19:55 for 20:30 puts the bottle in a Sprint rider's hand after hours. Licences inside "
    "60 days are listed for the office. 12 tests pass, 138 in the suite, driveable in the demo. BLOCKED "
    "on a real merchant licence copy on file"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 26:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(26)
    out.append(l)
text = "\n".join(out)
text = text.replace(
    "- Nobody owns buying or providing the rider phones.",
    "- THE CURRENT BOTSWANA LIQUOR STATUTE IS NOT ON THIS MACHINE. The Trade Act repealed the Trade and Liquor Act and the offline law library has no replacement. The app sidesteps this by enforcing each merchant's own licence, which is correct anyway, but nobody at Sprint can answer a question about the law itself. Add it to the law library. Owner: Luther.\n"
    "- Nobody owns buying or providing the rider phones.",
)
after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [26], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")

h = ROOT / "house.json"
cfg = json.loads(h.read_text(encoding="utf-8"))
cfg["accomplish"]["26"] = [
    "Liquor done right",
    "Only from a shop whose licence is on file, only in the hours that licence permits, and judged on when it will arrive rather than when it was ordered. No licence means no liquor, by default.",
]
h.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 06:55)", "# Sprint delivery app — STATE (2026-09-13, 07:40)")
t = t.replace("- 12 laid and verified, 11 in motion", "- 12 laid and verified, 12 in motion")
t = t.replace(
    "126 tests in the API suite.",
    "Brick 26's rule engine was built: liquor by the merchant's own licence, judged on arrival time. 138 tests in the API suite.",
)
s.write_text(t, encoding="utf-8")

hf = ROOT / "HANDOFF.md"
x = hf.read_text(encoding="utf-8")
x = x.replace("updated 13 September 06:55", "updated 13 September 07:40")
x = x.replace(
    "| 33 | Offline rider outbox,",
    "| 26 | Liquor by the merchant licence, api/src/orders/liquor.ts, 12 tests | Rule engine built, blocked on a real licence copy |\n| 33 | Offline rider outbox,",
)
hf.write_text(x, encoding="utf-8")
print("brick 26 rule engine recorded")
