# CONVRTD Brandify — Document Studio

Turn any Word (`.docx`) or PDF document into a polished, on-brand **CONVRTD** PDF.
Upload a file, pick a mode + theme, download a branded PDF. Your words are
preserved **verbatim** — this re-formats and re-brands, it never rewrites.

![CONVRTD Brandify](docs/preview.png)

## What it does

```
Upload → Extract → Structure → Compose branded HTML → Balance pages → Render (Chromium) → Branded PDF
```

Every generated PDF was validated by a 5-judge design panel (independent Claude
critics scoring against the CONVRTD brand guidelines); the templates were tuned
until 10 varied test documents all scored ≥9/10.

- **Two modes**
  - **Rebuild** — lays your content onto branded pages (cover, numbered sections,
    stat cards, closing) in the CONVRTD brand-book style.
  - **Restyle** — keeps your document's original order and applies the brand skin.
- **Two themes** — **Charcoal** (dark, the brand's dominant) or **Ivory** (light).
- **Word + PDF input** — `.docx` uses Word's real structure; PDF is parsed
  first-class (font-size clustering for headings, list/stat detection, wrapped-line
  repair).
- **Verbatim guarantee** — every generated PDF is checked so no wording is added or
  dropped (≥98% source word coverage, zero additions). If the optional AI structurer
  ever alters text, the app falls back to the deterministic structurer.

## Requirements

- Node.js 20+ (built and tested on Node 24)
- One-time: `npx playwright install chromium`

No API key is required — a deterministic structurer runs by default. Add an
`ANTHROPIC_API_KEY` to enable the optional Claude structuring upgrade (it only ever
*classifies/groups* text; it never authors copy, and its output is verbatim-checked
before use).

## Run

```bash
npm install
npx playwright install chromium
cp .env.example .env      # optional — add ANTHROPIC_API_KEY to enable the AI upgrade
npm run dev               # http://localhost:5178
```

Open http://localhost:5178, drop in a `.docx` or `.pdf`, choose Mode/Theme/Page,
and click **Generate branded PDF**.

## API

The whole pipeline sits behind one endpoint — this is the seam a future **n8n**
workflow calls:

```
POST /api/generate        (multipart/form-data)
  file      = <.docx | .pdf>
  mode      = rebuild | restyle
  theme     = charcoal | ivory
  pageSize  = A4 | Letter
→ 200 application/pdf   (headers: X-Structure-Source, X-Sections)
```

Example:

```bash
curl -X POST http://localhost:5178/api/generate \
  -F "file=@brief.docx" -F "mode=rebuild" -F "theme=charcoal" -F "pageSize=A4" \
  -o brief-CONVRTD.pdf
```

## Moving to n8n later

Because everything is behind `POST /api/generate`, an n8n workflow can drive it
without any rewrite:

```
Trigger (Form / Email / Google Drive)
  → HTTP Request (POST /api/generate, send the file as multipart)
  → respond / save the returned PDF (email back, upload to Drive, etc.)
```

Deploy this app as a container next to n8n on the VPS; n8n calls it over HTTP.

## Scripts

```bash
npm run make-samples          # build batch-1 sample inputs (add "2" for batch-2)
npm run batch                 # render all samples/inputs → samples/outputs (rebuild/charcoal)
npm run batch restyle ivory   # render a different mode/theme
npm run rasterize             # PDF pages → PNG in samples/shots (PyMuPDF)
npx tsx scripts/verify-verbatim.ts   # assert content preservation on all inputs
npm run typecheck
```

## Project layout

```
src/
  ingest.ts            upload validation + temp storage
  extract/docx.ts      Word → raw elements (mammoth)
  extract/pdf.ts       PDF → raw elements (pdfjs + layout heuristics)
  structure/           raw elements → DocModel (heuristic default, optional Claude), verbatim guard
  brand/               design tokens, embedded fonts, brand CSS + page chrome
  compose/             DocModel → branded HTML (rebuild / restyle)
  render.ts            HTML → PDF (Playwright Chromium) + adaptive page balancer
  pipeline.ts          the full pipeline
  server.ts            Fastify API + static UI
public/                branded upload/preview UI
fonts/                 Satoshi + Inter (embedded for print)
scripts/               sample generation, batch render, rasterize, verbatim check, QA
```

## Fonts & licensing

Satoshi and General Sans are free via [Fontshare](https://www.fontshare.com);
Inter is OFL (Google Fonts). All are embedded for print fidelity.

## Notes / limits

- PDF inputs are layout-locked: bullet markers are often not in a PDF's text layer,
  so PDF bullets may render as short paragraphs. Word inputs preserve bullets exactly.
- Accent colors (sage/amber/cyan) are reserved for data, per brand rules.
