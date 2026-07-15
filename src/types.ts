// Shared domain types for the CONVRTD Brandify pipeline.

export type FileKind = "docx" | "pdf";

export type RawElementType =
  | "heading"
  | "paragraph"
  | "listitem"
  | "quote"
  | "table"
  | "image"
  | "unknown";

/** A flat, ordered element straight out of an extractor. Text is verbatim. */
export interface RawElement {
  type: RawElementType;
  /** Heading level 1-4 when type === "heading". */
  level?: number;
  /** Exact source text. */
  text: string;
  /** Table rows (type === "table"). */
  rows?: string[][];
  /** Data URI for images (type === "image"). */
  src?: string;
  meta?: Record<string, unknown>;
}

export type BlockType =
  | "paragraph"
  | "list"
  | "stat"
  | "quote"
  | "callout"
  | "image"
  | "table"
  | "heading";

/** A semantic block inside a section. */
export interface Block {
  type: BlockType;
  text?: string;
  level?: number;
  /** List items (type === "list"). */
  items?: string[];
  /** Stat block (type === "stat"): value like "3.2×" + label like "ROAS". */
  value?: string;
  label?: string;
  src?: string;
  rows?: string[][];
}

export interface Section {
  eyebrow?: string;
  heading?: string;
  level?: number;
  blocks: Block[];
}

export interface DocModel {
  title?: string;
  subtitle?: string;
  sections: Section[];
}

export type Mode = "rebuild" | "restyle";
export type Theme = "charcoal" | "ivory";
export type PageSize = "A4" | "Letter";

export interface GenerateOptions {
  mode: Mode;
  theme: Theme;
  pageSize: PageSize;
  /** Attempt the Claude structuring upgrade when a key is present. */
  useLLM?: boolean;
}

export const DEFAULT_OPTIONS: GenerateOptions = {
  mode: "rebuild",
  theme: "charcoal",
  pageSize: "A4",
  useLLM: true,
};
