import type { DocModel } from "../types.js";
import { esc, lastWordIndigo, renderBlocks } from "./blocks.js";

const TAGLINE = "The best ads don’t look like ads.";

/** Rebuild: lay the content onto branded pages (cover → sections → closing). */
export function composeRebuild(model: DocModel): string {
  const title = model.title ?? "Untitled Document";
  const parts: string[] = [];

  // Cover — one vertically-centred lockup: funnel mark + wordmark lead the title.
  parts.push(`
  <section class="cover">
    <div class="cover-mid">
      <span class="brandmark"></span>
      <div class="wordmark">CONVRTD</div>
      <div class="eyebrow" style="margin-top:26px;"><span class="num">/</span>&nbsp; 2026</div>
      <h1 class="display">${lastWordIndigo(title)}</h1>
      ${model.subtitle ? `<p class="subtitle">${esc(model.subtitle)}</p>` : ""}
      <hr class="grad-rule" style="margin-top:30px;width:96px;"/>
    </div>
  </section>`);

  // Sections — flow; headings never orphan; efficient spacing keeps pages full.
  let n = 0;
  model.sections.forEach((sec) => {
    n += 1;
    const num = String(n).padStart(2, "0");
    const head = sec.heading
      ? `<div class="section-head avoid-break">
           <div class="eyebrow"><span class="num">${num}</span></div>
           <h2 class="h2">${lastWordIndigo(sec.heading)}</h2>
         </div>`
      : "";
    parts.push(`<section class="section">${head}${renderBlocks(sec.blocks)}</section>`);
  });

  // Closing — a truly centred full-page bookend (running footer carries the copyright).
  parts.push(`
  <section class="closing">
    <span class="brandmark"></span>
    <div class="wordmark">CONVRTD</div>
    <h2 class="display closing-line" style="margin-top:22px;">Built for <span class="lw">performance.</span></h2>
    <hr class="grad-rule" style="width:96px;margin:24px 0 26px;"/>
    <p class="end">${esc(TAGLINE)} This document was formatted with the CONVRTD brand system &mdash;
      every touchpoint measured against it.</p>
  </section>`);

  return `<div class="doc">${parts.join("\n")}</div>`;
}
