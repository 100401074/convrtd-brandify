import type { DocModel } from "../types.js";
import { esc, lastWordIndigo, renderBlocks } from "./blocks.js";

/**
 * Restyle: keep the document's original order/structure, apply the brand skin.
 * A single flowing document with a compact branded title block.
 */
export function composeRestyle(model: DocModel): string {
  const title = model.title ?? "Document";
  const parts: string[] = [];

  parts.push(`
  <header class="section-head" style="margin-bottom:26px;">
    <div class="eyebrow"><span class="num">/</span> ${esc(title.length > 40 ? "Document" : "Document")}</div>
    <h1 class="display" style="font-size:34pt;">${lastWordIndigo(title)}</h1>
    ${model.subtitle ? `<p class="lead" style="margin-top:14px;">${esc(model.subtitle)}</p>` : ""}
    <hr class="grad-rule" style="margin-top:18px;"/>
  </header>`);

  for (const sec of model.sections) {
    const head = sec.heading
      ? `<div class="section-head" style="margin-top:20px;"><h2 class="h2" style="font-size:19pt;">${lastWordIndigo(
          sec.heading,
        )}</h2></div>`
      : "";
    parts.push(`<section class="section" style="margin-bottom:16px;">${head}${renderBlocks(sec.blocks)}</section>`);
  }

  return `<div class="doc">${parts.join("\n")}</div>`;
}
