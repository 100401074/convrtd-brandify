import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generate } from "../src/pipeline.js";
import { closeBrowser } from "../src/render.js";
import type { Mode, Theme } from "../src/types.js";

const INPUTS = join(process.cwd(), "samples", "inputs");
const OUTPUTS = join(process.cwd(), "samples", "outputs");

async function main() {
  const mode = (process.argv[2] as Mode) || "rebuild";
  const theme = (process.argv[3] as Theme) || "charcoal";
  const only = process.argv[4]; // optional substring filter

  await mkdir(OUTPUTS, { recursive: true });
  const files = (await readdir(INPUTS)).filter(
    (f) => /\.(docx|pdf)$/i.test(f) && (!only || f.includes(only)),
  );
  if (files.length === 0) {
    console.error("No inputs found. Run `npm run make-samples` first.");
    process.exit(1);
  }

  for (const f of files) {
    const buf = await readFile(join(INPUTS, f));
    const t0 = Date.now();
    const { pdf, structureSource, sections } = await generate(buf, f, { mode, theme });
    const name = f.replace(/\.(docx|pdf)$/i, "");
    const out = `${name}__${mode}__${theme}.pdf`;
    await writeFile(join(OUTPUTS, out), pdf);
    console.log(
      `✓ ${out}  (${sections} sections, ${structureSource}, ${(Date.now() - t0) / 1000}s, ${(pdf.length / 1024).toFixed(0)}KB)`,
    );
  }
  await closeBrowser();
}

main().catch(async (e) => {
  await closeBrowser();
  console.error(e);
  process.exit(1);
});
