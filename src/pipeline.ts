import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { saveUpload } from "./ingest.js";
import { extractDocx } from "./extract/docx.js";
import { extractPdf } from "./extract/pdf.js";
import { structure } from "./structure/index.js";
import { compose } from "./compose/index.js";
import { renderPdf } from "./render.js";
import { DEFAULT_OPTIONS, type GenerateOptions } from "./types.js";

export interface GenerateResult {
  pdf: Buffer;
  structureSource: "llm" | "heuristic";
  sections: number;
}

export type ProgressFn = (stage: string, label: string, pct: number) => void;

/** Full document → branded PDF pipeline, with optional stage-by-stage progress. */
export async function generate(
  fileBuf: Buffer,
  filename: string,
  options: Partial<GenerateOptions> = {},
  onProgress: ProgressFn = () => {},
): Promise<GenerateResult> {
  const opts: GenerateOptions = { ...DEFAULT_OPTIONS, ...options };
  onProgress("ingest", "Reading your document", 8);
  const { path, kind } = await saveUpload(fileBuf, filename);
  try {
    onProgress("extract", "Extracting content", 22);
    const els = kind === "docx" ? await extractDocx(path) : await extractPdf(path);
    if (els.length === 0) throw new Error("No readable content found in the document.");
    onProgress("structure", "Understanding the structure", 42);
    const { model, source } = await structure(els, { useLLM: opts.useLLM });
    onProgress("compose", "Applying the CONVRTD brand", 58);
    const composed = await compose(model, opts);
    onProgress("render", "Rendering the branded PDF", 74);
    const pdf = await renderPdf(composed, opts);
    return { pdf, structureSource: source, sections: model.sections.length };
  } finally {
    await rm(dirname(path), { recursive: true, force: true }).catch(() => {});
  }
}
