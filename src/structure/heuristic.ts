import type { Block, DocModel, RawElement, Section } from "../types.js";

// Units that can trail a metric value: percent, multiplier, magnitudes, time spans.
const UNIT = "%|×|x|k|K|M|bn|B|h|d|w|\\+";
// A bare value like "3.2×", "-47%", "45", "10d".
const STAT_VALUE_ONLY = new RegExp(`^\\s*[+\\-−]?\\d[\\d.,]*\\s*(?:${UNIT})?\\s*$`);
// value <separator> label — e.g. "3.4× — Target ROAS", "10d — Onboarding".
const STAT_SEP = new RegExp(`^\\s*([+\\-−]?\\d[\\d.,]*\\s*(?:${UNIT})?)\\s*[—–\\-:·|]\\s+(.{2,40})$`);
// value+unit <space> short label (no separator) — e.g. "3.2× ROAS".
const STAT_UNIT = new RegExp(`^\\s*([+\\-−]?\\d[\\d.,]*\\s*(?:${UNIT}))\\s+(.{2,22})$`);

/**
 * Deterministic structurer — the always-on default that needs no API key.
 * Splits on headings, groups blocks, and recognises stats/quotes/lists.
 * Text is copied verbatim from the source elements.
 */
export function structureHeuristic(els: RawElement[]): DocModel {
  const model: DocModel = { sections: [] };

  // Title = the very first element (never skip leading content). A short
  // following paragraph that sits before the first heading is the subtitle.
  let start = 0;
  if (els.length > 0) {
    model.title = els[0].text;
    start = 1;
    const nx = els[1];
    const precedesHeading = els[2]?.type === "heading" || els.length === 2;
    if (nx && nx.type === "paragraph" && nx.text.length <= 180 && precedesHeading) {
      model.subtitle = nx.text;
      start = 2;
    }
  }

  let section: Section | null = null;
  const open = (s: Partial<Section>) => {
    section = { blocks: [], ...s };
    model.sections.push(section);
  };
  const ensure = () => {
    if (!section) open({});
    return section as Section;
  };

  for (let i = start; i < els.length; i++) {
    const el = els[i];
    if (el.type === "heading") {
      // A "heading" that is really a metric (bold/large KPI in the source).
      const asStatHeading = asStat(el.text);
      if (asStatHeading) {
        ensure().blocks.push(asStatHeading);
        continue;
      }
      open({ heading: el.text, level: el.level, eyebrow: sectionEyebrow(el.text) });
      continue;
    }
    const sec = ensure();
    if (el.type === "listitem") {
      const last = sec.blocks[sec.blocks.length - 1];
      if (last?.type === "list") last.items!.push(el.text);
      else sec.blocks.push({ type: "list", items: [el.text] });
      continue;
    }
    if (el.type === "quote") {
      sec.blocks.push({ type: "quote", text: el.text });
      continue;
    }
    if (el.type === "image") {
      sec.blocks.push({ type: "image", src: el.src });
      continue;
    }
    if (el.type === "table") {
      sec.blocks.push({ type: "table", rows: el.rows, text: el.text });
      continue;
    }
    // paragraph → maybe a stat
    const stat = asStat(el.text);
    if (stat) sec.blocks.push(stat);
    else sec.blocks.push({ type: "paragraph", text: el.text });
  }

  if (model.sections.length === 0) model.sections.push({ blocks: [] });
  return model;
}

function asStat(text: string): Block | null {
  const t = text.trim();
  if (t.length > 44) return null;
  if (STAT_VALUE_ONLY.test(t)) return { type: "stat", value: t.trim() };
  const sep = t.match(STAT_SEP);
  if (sep) return { type: "stat", value: sep[1].trim(), label: sep[2].trim() };
  const unit = t.match(STAT_UNIT);
  if (unit) return { type: "stat", value: unit[1].trim(), label: unit[2].trim() };
  return null;
}

/** A short letter-spaceable eyebrow derived verbatim from the heading itself. */
function sectionEyebrow(heading: string): string | undefined {
  // We do NOT invent text; eyebrow is only set later by compose using indices.
  void heading;
  return undefined;
}
