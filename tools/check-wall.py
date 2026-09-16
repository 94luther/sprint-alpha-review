"""Brick 6's real proof: the wall is checked, not merely large.

The old proof for "a plan that cannot lie" was that BRICKS.md is over 10 kilobytes. This asks the
questions that actually matter about a wall, and exits 1 on any of them.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
rows, problems = [], []

for line in (ROOT / "BRICKS.md").read_text(encoding="utf-8").splitlines():
    m = re.match(r"\|\s*(\d+)\s*\|", line)
    if not m:
        continue
    c = line.split("|")
    if len(c) != 8:
        problems.append(f"brick {m.group(1)} has {len(c)} cells, not 8")
        continue
    rows.append({"n": int(m.group(1)), "brick": c[2].strip(), "owner": c[3].strip(),
                 "stands_on": c[4].strip(), "proof": c[5].strip(), "status": c[6].strip()})

nums = [r["n"] for r in rows]
if nums != list(range(1, len(nums) + 1)):
    problems.append(f"brick numbers are not 1..{len(nums)} with no gaps or repeats")

proofs = json.loads((ROOT / "proofs.json").read_text(encoding="utf-8"))
for r in rows:
    if not r["brick"]:
        problems.append(f"brick {r['n']} has no description")
    if not r["owner"] or r["owner"].lower() in ("team", "tbc", "to be named", "-"):
        problems.append(f"brick {r['n']} has no named owner, it says '{r['owner']}'")
    if not r["proof"]:
        problems.append(f"brick {r['n']} names no proof, so nothing can ever lay it")
    if not re.match(r"\[[ x~]\]", r["status"]):
        problems.append(f"brick {r['n']} has no status mark")
    if r["status"].startswith("[x]") and len(r["status"]) < 20:
        problems.append(f"brick {r['n']} is marked laid with no note saying what laid it")
    if str(r["n"]) not in proofs:
        problems.append(f"brick {r['n']} has no entry in proofs.json, so the truth test never looks at it")

# A brick cannot stand on a brick that does not exist.
for r in rows:
    for dep in re.findall(r"\d+", r["stands_on"]):
        if int(dep) not in nums:
            problems.append(f"brick {r['n']} stands on {dep}, which is not on the wall")

if "## Not covered by any brick" not in (ROOT / "BRICKS.md").read_text(encoding="utf-8"):
    problems.append("the wall has no 'Not covered' section, so it is hiding its gaps")

print(f"wall: {len(rows)} bricks, {sum(1 for r in rows if r['status'].startswith('[x]'))} laid, "
      f"{len(problems)} problem(s)")
for p in problems:
    print("  PROBLEM:", p)
sys.exit(1 if problems else 0)
