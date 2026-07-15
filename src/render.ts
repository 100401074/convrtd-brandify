import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";
import { chromeTemplates } from "./brand/kit.js";
import type { Composed } from "./compose/index.js";
import type { GenerateOptions } from "./types.js";

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "fonts");
let interB64Cache: string | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) browserPromise = chromium.launch({ args: ["--no-sandbox"] });
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

/** Printable height per page in CSS px (page height − top/bottom pdf margins). */
const PRINTABLE_PX: Record<GenerateOptions["pageSize"], number> = {
  A4: (297 - 26 - 18) * (96 / 25.4), // ≈ 956
  Letter: (279.4 - 26 - 18) * (96 / 25.4), // ≈ 890
};

/**
 * Distribute inter-section spacing so content fills its pages evenly — compresses
 * a slight overflow to fit, expands an underfill so no page ends half-empty.
 * Runs in the browser against the live layout; fails silently on any edge case.
 */
async function balancePages(page: import("playwright").Page, pageSize: GenerateOptions["pageSize"]) {
  try {
    // tsx/esbuild wraps evaluate callbacks with a __name() helper that is undefined
    // in the browser context; define a no-op shim (as a plain string) so it works.
    await page.evaluate("globalThis.__name = globalThis.__name || function(f){return f}");
    await page.evaluate((P: number) => {
      const doc = document.querySelector(".doc");
      if (!doc) return;
      const secs = Array.from(doc.querySelectorAll<HTMLElement>(".section"));
      const k = secs.length;
      if (k < 2) return;
      secs.forEach((s) => (s.style.breakBefore = ""));
      const contentTop = secs[0].getBoundingClientRect().top;
      const H = secs[k - 1].getBoundingClientRect().bottom - contentTop;
      // Only rebalance when content genuinely spans >1 page; 0.95 leaves a little
      // room for print-time overhead without over-splitting docs that fit one page.
      const pages = Math.max(1, Math.ceil(H / (P * 0.95)));
      if (pages < 2) return;
      // Force page breaks at the section boundary nearest each even height division,
      // so sections distribute evenly instead of stranding one on a near-empty page.
      const per = H / pages;
      let pg = 1;
      for (let i = 0; i < k; i++) {
        const rect = secs[i].getBoundingClientRect();
        const mid = rect.top - contentTop + rect.height / 2;
        if (i > 0 && pg < pages && mid >= per * pg) {
          secs[i].style.breakBefore = "page";
          secs[i - 1].style.marginBottom = "0px"; // no trailing gap at the page bottom
          pg++;
        }
      }
    }, PRINTABLE_PX[pageSize]);
  } catch {
    /* keep default spacing on any failure */
  }
}

async function interB64(): Promise<string> {
  if (!interB64Cache) {
    interB64Cache = (await readFile(join(FONT_DIR, "inter-400.woff2"))).toString("base64");
  }
  return interB64Cache;
}

/** Render composed HTML to a branded PDF buffer with running header/footer + page numbers. */
export async function renderPdf(composed: Composed, opts: GenerateOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(composed.html, { waitUntil: "networkidle" });
    await page.evaluateHandle("document.fonts.ready");
    await balancePages(page, opts.pageSize);
    const { header, footer } = chromeTemplates({
      theme: composed.meta.theme,
      section: composed.meta.section,
      tagline: composed.meta.tagline,
      interB64: await interB64(),
    });
    const pdf = await page.pdf({
      format: opts.pageSize,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: header,
      footerTemplate: footer,
      margin: { top: "26mm", bottom: "18mm", left: "0mm", right: "0mm" },
    });
    return pdf;
  } finally {
    await page.close();
  }
}
