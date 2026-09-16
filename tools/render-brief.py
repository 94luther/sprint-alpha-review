"""Render a markdown brief as a branded Sprint PDF.

    python tools/render-brief.py docs/FAULT_MODEL.md "Who pays when a delivery fails" [--landscape]

Why this exists: every document in this project that a person has to read, agree or sign gets
rendered rather than handed over as markdown. Doing it by hand once is fine; twice means a tool.

Two things learned the hard way and baked in here:
  * Old headless Chrome ignores @page size and prints a nearly empty US Letter page. Use
    --headless=new with --virtual-time-budget, or you get a blank A4 that looks fine in a
    file listing and is useless on paper.
  * Always verify the result with PyMuPDF afterwards. Page count and character count per page
    catch a silent layout failure that a byte size never will.
"""
import html
import pathlib
import re
import subprocess
import sys

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROOT = pathlib.Path(__file__).resolve().parent.parent

CSS = """
@page { size: %(size)s; margin: 14mm 13mm 15mm 13mm; }
:root{--ink:#131311;--ink2:#1d1d19;--line:#d8d8d2;--dim:#6b6b64;--green:#3AAA35;--green-d:#2A7D27;--orange:#F7941D;}
*{box-sizing:border-box;margin:0;padding:0}
body{font:10pt/1.5 "Segoe UI",system-ui,sans-serif;color:var(--ink);background:#fff;
     -webkit-print-color-adjust:exact;print-color-adjust:exact}
.masthead{background:var(--ink);color:#F4F4F1;padding:7mm 8mm;margin:0 0 6mm;display:flex;
          align-items:flex-start;justify-content:space-between;gap:8mm}
.masthead h1{font-size:17pt;line-height:1.15;font-weight:700;letter-spacing:-.3pt;max-width:150mm}
.masthead .meta{font-size:8pt;color:#9a9a92;margin-top:2.5mm;letter-spacing:.3pt;text-transform:uppercase}
.masthead img{height:11mm}
h2{font-size:9.5pt;letter-spacing:1.3pt;text-transform:uppercase;color:var(--green-d);
   margin:6mm 0 2mm;font-weight:700;page-break-after:avoid}
h3{font-size:10.5pt;margin:4mm 0 1.5mm;page-break-after:avoid}
p{margin:0 0 2.5mm}
ul,ol{margin:0 0 2.5mm 5mm}
li{margin-bottom:1mm}
strong{color:var(--ink)}
code{font-family:Consolas,monospace;background:#f2f2ee;padding:0 1mm;border-radius:1mm}
table{border-collapse:collapse;width:100%%;margin:2mm 0 4mm;font-size:8pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th{background:var(--ink);color:#F4F4F1;text-align:left;padding:2mm 2.2mm;font-weight:600;
   font-size:7.5pt;letter-spacing:.3pt}
td{border-bottom:1px solid var(--line);padding:1.8mm 2.2mm;vertical-align:top}
tbody tr:nth-child(even) td{background:#fafaf7}
hr{border:0;border-top:1px solid var(--line);margin:5mm 0}
blockquote{border-left:3px solid var(--orange);background:#fff6e8;padding:3mm 4mm;margin:0 0 3mm}
.status{background:#fff6e8;border-left:3px solid var(--orange);padding:3mm 4mm;margin:0 0 4mm;font-size:9.5pt}
"""


def md_to_html(md: str) -> str:
    """Small markdown subset: headings, tables, lists, bold, code, rules, paragraphs."""
    out, lines, i = [], md.split("\n"), 0

    def inline(t: str) -> str:
        t = html.escape(t)
        t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
        t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
        return t

    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        if ln.startswith("# "):
            i += 1
            continue  # the title comes from the masthead, never twice
        if ln.startswith("## "):
            out.append(f"<h2>{inline(ln[3:].strip())}</h2>")
        elif ln.startswith("### "):
            out.append(f"<h3>{inline(ln[4:].strip())}</h3>")
        elif ln.startswith("---") and set(ln.strip()) == {"-"}:
            out.append("<hr>")
        elif ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i])
                i += 1
            i -= 1
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            body = [r for r in cells[1:] if not all(set(c) <= set("-: ") for c in r)]
            out.append("<table><thead><tr>"
                       + "".join(f"<th>{inline(c)}</th>" for c in cells[0])
                       + "</tr></thead><tbody>"
                       + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
                       + "</tbody></table>")
        elif re.match(r"^\s*[-*] ", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*] ", lines[i]):
                items.append(f"<li>{inline(re.sub(r'^\\s*[-*] ', '', lines[i]))}</li>")
                i += 1
            i -= 1
            out.append("<ul>" + "".join(items) + "</ul>")
        elif re.match(r"^\s*\d+\. ", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\. ", lines[i]):
                items.append(f"<li>{inline(re.sub(r'^\\s*\\d+\\. ', '', lines[i]))}</li>")
                i += 1
            i -= 1
            out.append("<ol>" + "".join(items) + "</ol>")
        else:
            cls = ' class="status"' if ln.strip().startswith("**Status:") else ""
            out.append(f"<p{cls}>{inline(ln.strip())}</p>")
        i += 1
    return "\n".join(out)


def render(md_path: pathlib.Path, title: str, landscape: bool = False) -> pathlib.Path:
    md = md_path.read_text(encoding="utf-8")
    subtitle = "SPRINT COURIERS &nbsp;·&nbsp; DELIVERY PROJECT &nbsp;·&nbsp; " + \
               pathlib.Path(md_path).stem.replace("_", " ").title()
    page = (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        f"<title>{html.escape(title)}</title><style>"
        + CSS % {"size": "A4 landscape" if landscape else "A4"}
        + "</style></head><body>"
        f'<div class="masthead"><div><h1>{html.escape(title)}</h1>'
        f'<div class="meta">{subtitle}</div></div>'
        '<img src="logo-mark.png" alt="Sprint Couriers"></div>'
        + md_to_html(md) + "</body></html>"
    )
    work = md_path.parent
    logo = work / "logo-mark.png"
    if not logo.exists():
        src = ROOT / "docs" / "logo-mark.png"
        if src.exists():
            logo.write_bytes(src.read_bytes())
    html_path = work / (md_path.stem + ".html")
    pdf_path = work / (md_path.stem + ".pdf")
    html_path.write_text(page, encoding="utf-8")
    if pdf_path.exists():
        pdf_path.unlink()
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         "--virtual-time-budget=6000", "--run-all-compositor-stages-before-draw",
         f"--print-to-pdf={pdf_path}", str(html_path)],
        capture_output=True, timeout=180,
    )
    return pdf_path


def verify(pdf_path: pathlib.Path) -> bool:
    import pymupdf
    if not pdf_path.exists():
        print("FAILED: no PDF was written")
        return False
    d = pymupdf.open(pdf_path)
    ok = True
    print(f"{pdf_path.name}: {d.page_count} page(s), {pdf_path.stat().st_size // 1024} kb")
    for i, pg in enumerate(d):
        w = round(pg.rect.width / 72 * 25.4)
        h = round(pg.rect.height / 72 * 25.4)
        chars = len(pg.get_text())
        flag = ""
        if (w, h) not in [(210, 297), (297, 210)]:
            flag, ok = "  <-- NOT A4", False
        if chars < 100:
            flag, ok = flag + "  <-- almost empty", False
        print(f"  page {i + 1}: {w}x{h}mm, {chars} chars{flag}")
    return ok


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src = pathlib.Path(sys.argv[1])
    if not src.is_absolute():
        src = ROOT / src
    out = render(src, sys.argv[2], landscape="--landscape" in sys.argv)
    sys.exit(0 if verify(out) else 1)
