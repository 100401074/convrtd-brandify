import type { PageSize } from "../types.js";

/** Printable fill height per page size (page height − top/bottom pdf margins). */
const FILL: Record<PageSize, string> = {
  A4: "252mm", // 297 − 26 − 18, minus a hair to avoid overflow
  Letter: "234mm", // 279.4 − 26 − 18
};

/** The full brand stylesheet (fonts injected separately). */
export function brandCss(pageSize: PageSize): string {
  return `
:root{
  --charcoal:#111827; --charcoal-deep:#0D0D0D; --charcoal-2:#1C1C1C;
  --ivory:#FAF9F6; --white:#FFFFFF;
  --indigo:#4F46E5; --indigo-lo:#403AA4; --indigo-dk:#312C7F; --indigo-hi:#C5C1FD;
  --gray:#6B7280; --sage:#7DD3A0; --amber:#F59E0B; --cyan:#22C7E8;
  --grad-indigo:linear-gradient(86deg,#C5C1FD -2.8%,#4F46E5 10.7%,#403AA4 17.4%,#312C7F 24.5%,#403AA4 70.3%,#4F46E5 80.7%,#C5C1FD 99.2%);
  --font-display:'Satoshi','General Sans',system-ui,sans-serif;
  --font-body:'Inter',system-ui,sans-serif;
  --page-fill:${FILL[pageSize]};
}

/* ---------- Themes ---------- */
[data-theme="charcoal"]{
  --bg:#0D0D0D; --ink:#FAF9F6; --muted:#A6ADBB; --faint:#6B7280;
  --surface:#141A26; --surface-2:#1C2331; --hair:rgba(255,255,255,.09);
  --card-ink:#FAF9F6;
}
[data-theme="ivory"]{
  --bg:#FAF9F6; --ink:#111827; --muted:#4B5563; --faint:#9AA1AC;
  --surface:#FFFFFF; --surface-2:#F1EFEA; --hair:rgba(17,24,39,.10);
  --card-ink:#FAF9F6;
}

*{box-sizing:border-box;margin:0;padding:0;}
@page{size:${pageSize};}
html{background:var(--bg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{
  background:var(--bg); color:var(--ink);
  font-family:var(--font-body); font-size:11pt; line-height:1.62;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  font-feature-settings:"kern" 1,"liga" 1;
}

/* Horizontal page padding (pdf left/right margins are 0 so we own the gutter). */
.doc{padding:0 18mm;}

/* ---------- Running chrome placeholders (rendered via header/footer templates) ---------- */

/* ---------- Wordmark + standalone funnel mark ---------- */
.wordmark{font-family:var(--font-display);font-weight:700;letter-spacing:.34em;font-size:15pt;
  color:var(--ink);display:block;}
.brandmark{display:block;width:26px;height:22px;margin-bottom:13px;
  background:var(--indigo);clip-path:polygon(0 0,100% 0,50% 100%);}
.closing .brandmark{margin-left:auto;margin-right:auto;}

/* ---------- Eyebrow / section number ---------- */
.eyebrow{font-family:var(--font-body);font-weight:700;font-size:9pt;letter-spacing:.26em;
  text-transform:uppercase;color:var(--indigo);margin-bottom:16px;line-height:1;}
.eyebrow .num{color:var(--indigo);font-family:var(--font-display);font-weight:900;font-size:2.1em;
  letter-spacing:.06em;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;}

/* ---------- Display / headings ---------- */
.display{font-family:var(--font-display);font-weight:700;font-size:46pt;line-height:1.02;
  letter-spacing:-.015em;color:var(--ink);}
.display .lw{color:var(--indigo);}
.h2{font-family:var(--font-display);font-weight:500;font-size:26pt;line-height:1.12;
  letter-spacing:-.01em;color:var(--ink);margin:0 0 4px;}
.h2 .lw{color:var(--indigo);}
.h3{font-family:var(--font-display);font-weight:500;font-size:15pt;line-height:1.25;
  color:var(--ink);margin:0 0 2px;}

/* ---------- Body ---------- */
.body{font-family:var(--font-body);font-size:11pt;line-height:1.68;color:var(--muted);
  margin:0 0 13px;max-width:80ch;}
.lead{font-family:var(--font-display);font-weight:400;font-size:14pt;line-height:1.5;
  color:var(--ink);margin:0 0 16px;max-width:70ch;}
.caption{font-family:var(--font-body);font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);}

/* ---------- Lists ---------- */
.list{list-style:none;margin:4px 0 14px;max-width:80ch;}
.list li{position:relative;padding-left:20px;margin:0 0 9px;font-family:var(--font-body);
  font-size:11pt;line-height:1.6;color:var(--muted);}
.list li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:7px;
  background:var(--indigo);clip-path:polygon(0 0,100% 0,50% 100%);}

/* ---------- Stats (ivory data cards — the 30% surface register) ---------- */
.stats{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0 24px;}
.stat{flex:1 1 150px;background:var(--ivory);border:1px solid rgba(17,24,39,.06);border-radius:16px;
  padding:24px 24px;box-shadow:0 3px 12px rgba(0,0,0,.12);}
.stat .v{font-family:var(--font-display);font-weight:900;font-size:34pt;line-height:1;
  letter-spacing:-.02em;color:var(--indigo);}
.stat .l{margin-top:10px;font-family:var(--font-body);font-size:8pt;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;color:#374151;}
[data-theme="ivory"] .stat{background:#fff;box-shadow:0 12px 30px rgba(17,24,39,.08);}

/* ---------- Quote ---------- */
.quote{position:relative;margin:14px 0 18px;padding:6px 0 6px 26px;
  border-left:3px solid var(--indigo);}
.quote p{font-family:var(--font-display);font-weight:400;font-style:italic;font-size:17pt;
  line-height:1.4;color:var(--ink);}

/* ---------- Callout ---------- */
.callout{background:var(--surface);border:1px solid var(--hair);border-left:3px solid var(--indigo);
  border-radius:12px;padding:18px 22px;margin:14px 0 18px;}
.callout p{font-family:var(--font-body);font-size:11pt;line-height:1.6;color:var(--ink);}

/* ---------- Table ---------- */
table.brand{width:100%;border-collapse:collapse;margin:8px 0 18px;font-family:var(--font-body);font-size:10pt;}
table.brand th{text-align:left;font-weight:700;color:var(--ink);border-bottom:2px solid var(--indigo);
  padding:9px 12px;font-size:8.5pt;letter-spacing:.08em;text-transform:uppercase;}
table.brand td{padding:9px 12px;color:var(--muted);border-bottom:1px solid var(--hair);}

/* ---------- Image ---------- */
.figure{margin:8px 0 18px;}
.figure img{width:100%;border-radius:12px;border:1px solid var(--hair);display:block;}

/* ---------- Section block ---------- */
.section{margin:0 0 34px;}
.section:first-of-type{padding-top:2mm;}
.section-head{margin:0 0 16px;break-after:avoid;break-inside:avoid;}
.rule{height:1px;background:var(--hair);border:0;margin:0 0 22px;}
.grad-rule{height:3px;border:0;border-radius:3px;background:var(--indigo);width:64px;margin:0 0 22px;}

/* two-column intro layout */
.cols{display:grid;grid-template-columns:0.9fr 1.1fr;gap:34px;align-items:start;}

/* ---------- Full-page sections ---------- */
.fill{min-height:var(--page-fill);display:flex;flex-direction:column;}
.break-before{break-before:page;}
.break-after{break-after:page;}
.avoid-break{break-inside:avoid;}

/* Cover — a centred lockup that mirrors the closing bookend (padding-bottom offsets
   the asymmetric top/bottom pdf margins so it lands on true page-optical-centre) */
.cover{min-height:var(--page-fill);display:flex;flex-direction:column;justify-content:center;
  align-items:center;text-align:center;padding-bottom:8mm;break-after:page;}
.cover-mid{padding:8px 0;display:flex;flex-direction:column;align-items:center;}
.cover .brandmark{margin-left:auto;margin-right:auto;}
.cover .display{font-size:52pt;}
.cover .subtitle{font-family:var(--font-display);font-weight:300;font-size:18pt;line-height:1.35;
  color:var(--muted);margin-top:22px;max-width:88%;}
.cover .grad-rule{margin-left:auto;margin-right:auto;}

/* Section divider */
.divider{min-height:var(--page-fill);display:flex;flex-direction:column;justify-content:center;
  break-before:page;break-after:page;}
.divider .idx{font-family:var(--font-display);font-weight:900;font-size:20pt;color:var(--indigo);
  letter-spacing:.05em;margin-bottom:18px;}
.divider .display{font-size:50pt;max-width:16ch;}

/* Closing — a truly centred full-page bookend */
.closing{min-height:var(--page-fill);display:flex;flex-direction:column;justify-content:center;
  align-items:center;text-align:center;padding-bottom:8mm;break-before:page;}
.closing .wordmark{margin-bottom:26px;}
.closing-line{font-size:38pt;}
.closing .end{font-family:var(--font-body);font-size:11.5pt;line-height:1.7;
  color:var(--muted);max-width:52ch;}
`;
}

/** Header/footer templates for Playwright's displayHeaderFooter (theme-aware, own fonts). */
export function chromeTemplates(opts: {
  theme: "charcoal" | "ivory";
  section: string;
  tagline: string;
  interB64: string;
}): { header: string; footer: string } {
  const ink = opts.theme === "charcoal" ? "#FAF9F6" : "#111827";
  const faint = opts.theme === "charcoal" ? "#8C94A2" : "#8B909B";
  const tag = opts.theme === "charcoal" ? "#B9BFCB" : "#6B7280";
  const bg = opts.theme === "charcoal" ? "#0D0D0D" : "#FAF9F6";
  const indigo = "#4F46E5";
  const face = `@font-face{font-family:'Inter';font-weight:400 700;src:url(data:font/woff2;base64,${opts.interB64}) format('woff2');}`;
  const base = (align: string) => `<style>${face}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;}
    html,body{margin:0;padding:0;width:100%;height:100%;}
    .wrap{width:100%;height:100%;background:${bg};display:flex;align-items:${align};overflow:hidden;}
    .row{width:100%;font-family:'Inter',sans-serif;padding:0 18mm;display:flex;justify-content:space-between;align-items:center;}
    .cap{font-size:6.5pt;letter-spacing:.22em;text-transform:uppercase;}</style>`;
  const header = `${base("center")}<div class="wrap"><div class="row">
      <div class="cap"><span style="color:${ink};font-weight:700;">CONVRTD</span><span style="color:${faint};">&nbsp;/&nbsp;${escapeHtml(
        opts.section,
      )}</span></div>
      <div class="cap" style="color:${tag};">${escapeHtml(opts.tagline)}</div>
    </div></div>`;
  const footer = `${base("center")}<div class="wrap"><div class="row">
      <div class="cap" style="color:${faint};">CONVRTD &copy; 2026</div>
      <div class="cap" style="color:${indigo};letter-spacing:.14em;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div></div>`;
  return { header, footer };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
