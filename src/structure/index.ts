import type { DocModel, RawElement } from "../types.js";
import { structureHeuristic } from "./heuristic.js";
import { structureLLM } from "./llm.js";
import { assertVerbatim } from "./verbatim.js";

export interface StructureResult {
  model: DocModel;
  source: "llm" | "heuristic";
}

/**
 * Produce a DocModel from raw elements. Tries the Claude upgrade when enabled and
 * a key is present, but ONLY accepts it if it passes the verbatim guard; otherwise
 * falls back to the deterministic structurer. Never throws; never emits new text.
 */
export async function structure(
  els: RawElement[],
  opts: { useLLM?: boolean } = {},
): Promise<StructureResult> {
  const sourceText = els.map((e) => e.text).join("\n");
  if (opts.useLLM) {
    const llm = await structureLLM(els);
    if (llm && assertVerbatim(sourceText, llm).ok) {
      return { model: llm, source: "llm" };
    }
  }
  return { model: structureHeuristic(els), source: "heuristic" };
}
