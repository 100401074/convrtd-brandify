import type { DocModel } from "../types.js";

/** Normalize text for comparison: lowercase, strip punctuation runs, collapse ws. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s]+/g, " ")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** All text spans carried by a DocModel, in order. */
export function modelTexts(model: DocModel): string[] {
  const out: string[] = [];
  if (model.title) out.push(model.title);
  if (model.subtitle) out.push(model.subtitle);
  for (const sec of model.sections) {
    if (sec.eyebrow) out.push(sec.eyebrow);
    if (sec.heading) out.push(sec.heading);
    for (const b of sec.blocks) {
      if (b.text) out.push(b.text);
      if (b.value) out.push(b.value);
      if (b.label) out.push(b.label);
      for (const it of b.items ?? []) out.push(it);
      for (const row of b.rows ?? []) for (const cell of row) out.push(cell);
    }
  }
  return out;
}

/**
 * Verify the model neither invented nor dropped wording.
 * - No additions: every model text span must appear inside the normalized source.
 * - No loss: the model's words must cover ≥98% of the source's words.
 * Reordering and re-grouping are allowed.
 */
export function assertVerbatim(
  sourceText: string,
  model: DocModel,
): { ok: boolean; added: string[]; coverage: number } {
  const src = normalize(sourceText);
  const added: string[] = [];
  const spans = modelTexts(model);
  for (const span of spans) {
    const n = normalize(span);
    if (n.length === 0) continue;
    if (!src.includes(n)) added.push(span);
  }

  // Coverage: fraction of source words present in the model's words.
  const srcWords = new Set(src.split(" ").filter(Boolean));
  const modelWords = new Set(
    spans
      .flatMap((s) => normalize(s).split(" "))
      .filter(Boolean),
  );
  let hit = 0;
  for (const w of srcWords) if (modelWords.has(w)) hit++;
  const coverage = srcWords.size === 0 ? 1 : hit / srcWords.size;

  return { ok: added.length === 0 && coverage >= 0.98, added, coverage };
}
