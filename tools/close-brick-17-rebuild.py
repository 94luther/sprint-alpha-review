"""Brick 17 rebuilt after the two column read was found wrong, and brick 7's page corrected."""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

pr = ROOT / "proofs.json"
d = json.loads(pr.read_text(encoding="utf-8"))

# The old checks asked whether the file existed and was big enough. None of them asked whether each
# address belonged to the branch above it, which is exactly how the column shift got through.
d["17"] = [
    {"type": "file", "path": "api/src/orders/network-sites.json", "min_bytes": 9000},
    {"type": "file", "path": "api/src/orders/network.ts", "min_bytes": 5000},
    {"type": "text_contains", "path": "api/src/orders/network.ts", "pattern": "checkEmailsMatchBranches"},
    {"type": "text_contains", "path": "api/src/orders/network-sites.json", "pattern": "kanye@sprintcouriers\.co\.bw"},
    {"type": "text_contains", "path": "api/src/orders/network-sites.json", "pattern": "commercepark@sprintcouriers\.co\.bw"},
    {"type": "text_contains", "path": "api/src/orders/network-sites.json", "pattern": "(?i)two columns"},
    # The invented place name the map read produced. It must never come back.
    {"type": "text_contains", "path": "api/src/orders/network-sites.json",
     "pattern": "(?i)bobonong gabojango", "expect": False},
    {"type": "attested", "note_pattern": "(?i)174 tests"},
]

# Brick 7 now also has to prove the page does not carry the figure nothing can source.
seven = [c for c in d.get("7", []) if not (c.get("type") == "text_contains" and "55" in str(c.get("pattern", "")))]
seven += [
    {"type": "text_contains", "path": "docs/FRAME.md", "pattern": "(?i)55 branches", "expect": False},
    {"type": "text_contains", "path": "docs/FRAME.pdf", "pattern": "(?i)over 50 branches"},
]
d["7"] = seven
pr.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---- the wall, edited cell by cell, never by line pattern ----
p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))

notes = {
 17: "[x] REBUILT AND LAID 12 Sep 2026. The first read of the company profile was WRONG and every test passed anyway. The branch pages print in TWO COLUMNS; read as flowing text, each branch name was paired with the NEXT branch's address. Kanye's address, phone and email were printed under Commerce Park, so a customer told their parcel was at Commerce Park would have been sent about 85 km down the road. Kanye, BDF SSKB Camp, Letlhakeng and Shoshong were missing from the app altogether. The coverage page is a MAP, and neighbouring town labels had been glued into places that do not exist, such as Bobonong Gabojango, so real towns were refused. Rebuilt by word coordinates with the columns kept apart: 30 offices and 27 service points in Botswana with a printed address, 3 in South Africa, 76 towns on the map. checkEmailsMatchBranches now fails the build if a name ever slides against an address again, because kanye@ belongs to Kanye. 174 tests pass",
 7:  "[~] frame page written, rendered and CORRECTED 12 Sep 2026: it said 55 branches, which the profile does not say anywhere. The profile says over 50 branches on page 2, and the branch pages count 57 offices and service points in Botswana plus 3 in South Africa. The page now uses the company's own words, the PDF was re rendered and the stale attachment inside the Outlook draft was replaced, so what Barbara carries on Thu 17 Sep 15:00 is the corrected page. Still in motion: the proof is Barbara's reply saying it went up",
}
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) in notes:
        n = int(m.group(1))
        c = l.split("|")
        assert len(c) == 8, (n, len(c))
        c[6] = " " + notes[n] + " "
        l = "|".join(c)
        touched.append(n)
    out.append(l)
text = "\n".join(out)

gap = ("- The branch network is read out of a PDF, and a PDF has no idea which address belongs to which branch. "
       "The guard now catches an email landing on the wrong branch, but a branch that has moved, closed or opened "
       "since the profile was printed is invisible to every check here. Nobody has confirmed the 57 sites against "
       "what is actually open today. Owner: Barbara, one pass down the list.\n")
text = text.replace("- THE \"55 BRANCHES\" FIGURE IS NOT SOURCED.", gap + "- THE \"55 BRANCHES\" FIGURE IS NOT SOURCED.")
text = text.replace("- THE \"55 BRANCHES\" FIGURE IS NOT SOURCED.",
                    "- The \"55 branches\" figure is still in the blueprint and in the memory. It was removed from the frame page and the app on 12 Sep 2026. The profile's own words are over 50 branches, and 57 sites carry a printed address. Anywhere else that repeats 55 needs the same correction. Owner: Luther.")

after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and sorted(touched) == [7, 17], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")
print(f"wall: {before} bricks before, {after} after, touched {sorted(touched)}")
