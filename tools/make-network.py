"""Build the real Sprint network file from the company profile, not from memory.

Brick 17. The plan said "55 branches", which is a number nobody on this machine can source. The
company profile says something different and more precise, and it names every office with its
address, its phone and its email. That is what the app dispatches on.
"""
import json
import pathlib
import re
from datetime import date

import pymupdf

PROFILE = pathlib.Path(
    r"C:\Users\SALES\Desktop\LAB_0341_Tender_Pack_WINDOWS\COMPANY-DOCS\SC Profile 2026_.pdf"
)
OUT = pathlib.Path(__file__).resolve().parent.parent / "api" / "src" / "orders" / "network-sites.json"

HEAD = re.compile(r"([A-Z][A-Za-z' ]{2,28}?)\s+(Office|Service Point)\b")


def main():
    doc = pymupdf.open(PROFILE)
    text = " ".join(" ".join(doc[p].get_text().split()) for p in range(23, doc.page_count))

    # Cut the run of text into one block per office, keeping the name that opened it.
    marks = [(m.start(), m.group(1).strip(), m.group(2)) for m in HEAD.finditer(text)]
    sites = []
    for i, (pos, name, kind) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        block = text[pos:end]
        addr = re.search(r"Physical Address:\s*:?\s*(.+?)(?:Contact Numbers|Postal Address|Email|$)", block)
        phones = re.search(r"Contact Numbers?:\s*(.+?)(?:Email|Physical|Customer|Operations|$)", block)
        email = re.search(r"Email:\s*([\w.@|\s]+?)(?:\s{2,}|Physical|Contact|$)", block)
        if not addr:
            continue
        # A page header can bleed into the name where the profile runs two columns together.
        name = re.sub(r"^.*?(?:CONTACTS|PROFILE|\d)\s+", "", name).strip()
        if not name or len(name) < 3:
            continue
        sites.append({
            "name": name,
            "kind": "office" if kind == "Office" else "service_point",
            "address": addr.group(1).strip(" :,"),
            "phones": [p.strip() for p in re.split(r"\||,", phones.group(1))][:4] if phones else [],
            "email": (email.group(1).split("|")[0].strip() if email else None),
            "international": bool(re.search(r"\+27", block)),
        })

    # Coverage, quoted rather than counted, because the profile is the only source for it.
    page7 = " ".join(doc[6].get_text().split())
    claim = re.search(r"presence in ([^.]+)\.", page7)
    towns = re.findall(r"\b([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b", page7.split("Sprint Couriers Routes")[0])
    stop = {"Sprint", "Couriers", "Offices", "Service", "Points", "Company", "Profile", "Express",
            "Botswana", "As", "The", "Well", "Head"}
    towns = sorted({t for t in towns if t not in stop and len(t) > 3})

    out = {
        "_source": {
            "document": PROFILE.name,
            "pages": "7 for coverage, 24 to 26 for the offices",
            "read_on": date.today().isoformat(),
            "method": "read out of the profile PDF, never from memory or a summary",
            "warning": "The plan elsewhere says 55 branches. The profile does not say that. It is quoted below instead.",
        },
        "coverage_claim": claim.group(1).strip() if claim else None,
        "sites": sites,
        "places_named_in_the_profile": towns,
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    botswana = [s for s in sites if not s["international"]]
    print(f"wrote {OUT.name}")
    print(f"  sites parsed: {len(sites)} ({len(botswana)} in Botswana, {len(sites) - len(botswana)} international)")
    print(f"  places named on page 7: {len(towns)}")
    print(f"  coverage claim: {out['coverage_claim']}")
    for s in botswana[:6]:
        print(f"   - {s['name']} ({s['kind']}): {s['address'][:52]}")


if __name__ == "__main__":
    main()
