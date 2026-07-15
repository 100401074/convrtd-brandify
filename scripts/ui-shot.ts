import { chromium } from "playwright";
import { join } from "node:path";

const BASE = "http://localhost:5178";
const SHOTS = join(process.cwd(), "samples", "shots");
const SAMPLE = join(process.cwd(), "samples", "inputs", "campaign-brief.docx");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, "ui-01-landing.png"), fullPage: true });

  // Upload a sample and generate.
  await page.setInputFiles("#file", SAMPLE);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SHOTS, "ui-02-filled.png"), fullPage: true });

  await page.click("#go");
  await page.waitForSelector("#result:not([hidden])", { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(SHOTS, "ui-03-result.png"), fullPage: true });

  console.log("UI screenshots saved.");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
