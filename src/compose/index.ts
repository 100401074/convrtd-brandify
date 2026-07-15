import type { DocModel, GenerateOptions } from "../types.js";
import { fontFaceCss } from "../brand/fonts.js";
import { brandCss } from "../brand/kit.js";
import { composeRebuild } from "./rebuild.js";
import { composeRestyle } from "./restyle.js";

export interface Composed {
  html: string;
  meta: { section: string; tagline: string; theme: "charcoal" | "ivory" };
}

const TAGLINE = "The best ads don’t look like ads.";

/** Turn a DocModel + options into a full, self-contained HTML document. */
export async function compose(model: DocModel, opts: GenerateOptions): Promise<Composed> {
  const fonts = await fontFaceCss();
  const css = brandCss(opts.pageSize);
  const body = opts.mode === "restyle" ? composeRestyle(model) : composeRebuild(model);
  const title = model.title ?? "CONVRTD Document";

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>${escapeAttr(title)}</title>
<style>${fonts}</style>
<style>${css}</style>
</head><body data-theme="${opts.theme}">${body}</body></html>`;

  return {
    html,
    meta: { section: "Brand Document", tagline: TAGLINE, theme: opts.theme },
  };
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
