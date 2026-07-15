import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { saveUpload } from "../src/ingest.js";
import { extractDocx } from "../src/extract/docx.js";
import { extractPdf } from "../src/extract/pdf.js";
import { structure } from "../src/structure/index.js";
import { assertVerbatim } from "../src/structure/verbatim.js";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";

const INPUTS = join(process.cwd(), "samples", "inputs");

async function main() {
  const files = (await readdir(INPUTS)).filter((f) => /\.(docx|pdf)$/i.test(f));
  let failed = 0;
  for (const f of files) {
    const buf = await readFile(join(INPUTS, f));
    const { path, kind } = await saveUpload(buf, f);
    try {
      const els = kind === "docx" ? await extractDocx(path) : await extractPdf(path);
      const { model } = await structure(els, { useLLM: false });
      const sourceText = els.map((e) => e.text).join("\n");
      const v = assertVerbatim(sourceText, model);
      const pct = (v.coverage * 100).toFixed(1);
      const flag = v.ok ? "✓" : "✗";
      if (!v.ok) failed++;
      console.log(`${flag} ${f}  coverage=${pct}%  added=${v.added.length}`);
      if (v.added.length) console.log("   added:", v.added.slice(0, 5));
    } finally {
      await rm(dirname(path), { recursive: true, force: true }).catch(() => {});
    }
  }
  console.log(failed === 0 ? "\nALL VERBATIM ✓" : `\n${failed} FILE(S) FAILED VERBATIM`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
