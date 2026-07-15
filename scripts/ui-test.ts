import { chromium } from "playwright";
import { join } from "node:path";

const BASE = process.env.TEST_BASE || "http://localhost:5178";
const SHOTS = join(process.cwd(), "samples", "shots");
const SAMPLE = join(process.cwd(), "samples", "inputs", "campaign-brief.docx");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, "ui-01-landing.png"), fullPage: true });

  await page.setInputFiles("#file", SAMPLE);
  await page.click("#go");

  // Progress card should appear; capture it mid-flow.
  await page.waitForSelector("#progress-card:not([hidden])", { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, "ui-02-progress.png"), fullPage: true });

  // Result should appear when done.
  await page.waitForSelector("#result:not([hidden])", { timeout: 60000 });
  await page.waitForTimeout(800);
  const dl = await page.getAttribute("#download", "href");
  const meta = await page.textContent("#result-meta");
  await page.screenshot({ path: join(SHOTS, "ui-03-result.png"), fullPage: true });

  // Verify the download actually returns a PDF.
  const resp = await page.request.get(BASE + dl);
  const buf = await resp.body();
  const ok = buf.slice(0, 5).toString() === "%PDF-";
  console.log(JSON.stringify({ downloadHref: dl, meta, downloadOk: ok, bytes: buf.length }));

  await browser.close();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
