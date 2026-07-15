import type { DocModel, RawElement } from "../types.js";

const MODEL = process.env.STRUCTURE_MODEL || "claude-opus-4-8";

/**
 * Optional Claude structuring upgrade. Given raw elements, Claude classifies and
 * groups them into a DocModel WITHOUT authoring any new text. Returns null on any
 * problem so the caller can fall back to the deterministic structurer.
 */
export async function structureLLM(els: RawElement[]): Promise<DocModel | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const numbered = els
      .map((e, i) => `${i}\t${e.type}${e.level ? `(h${e.level})` : ""}\t${e.text}`)
      .join("\n");

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system:
        "You are a document-structuring engine. You NEVER rewrite, summarize, translate, or invent text. " +
        "You only classify and group verbatim source lines into a branded document model. " +
        "Every string you output must be copied character-for-character from a source line.",
      messages: [
        {
          role: "user",
          content:
            "Group these source lines into JSON matching this TypeScript type:\n" +
            "type DocModel={title?:string;subtitle?:string;sections:{eyebrow?:string;heading?:string;level?:number;" +
            "blocks:{type:'paragraph'|'list'|'stat'|'quote'|'callout'|'image'|'table';text?:string;items?:string[];" +
            "value?:string;label?:string}[]}[]}\n\n" +
            "Rules: copy text verbatim; a heading starts a section; consecutive list items → one list block; " +
            "short numeric metrics (e.g. '3.2x ROAS', '-47% CPA') → stat blocks with value+label split from the SAME line; " +
            "do not add eyebrows or any text not present in the source. Output ONLY the JSON.\n\n" +
            "SOURCE LINES (index<TAB>type<TAB>text):\n" +
            numbered,
        },
      ],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const model = JSON.parse(json) as DocModel;
    if (!Array.isArray(model.sections)) return null;
    return model;
  } catch {
    return null;
  }
}
