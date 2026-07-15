import { readFile } from "node:fs/promises";
import type { RawElement } from "../types.js";

// pdfjs legacy build works in Node without a browser worker.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

interface Line {
  text: string;
  x: number;
  y: number;
  size: number;
}

/**
 * Extract ordered RawElements from a PDF. First-class treatment: reconstruct
 * lines from positioned glyph runs, cluster font sizes to infer heading levels,
 * and detect list/eyebrow patterns. Text is preserved verbatim.
 */
export async function extractPdf(path: string): Promise<RawElement[]> {
  const data = new Uint8Array(await readFile(path));
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const allLines: Line[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    allLines.push(...groupLines(content.items));
  }
  doc.destroy?.();

  if (allLines.length === 0) return [];
  return classify(allLines);
}

/** Group positioned text items into visual lines (same page order preserved). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupLines(items: any[]): Line[] {
  const glyphs = items
    .filter((it) => typeof it.str === "string" && it.str.length > 0)
    .map((it) => ({
      str: it.str as string,
      x: it.transform[4] as number,
      y: it.transform[5] as number,
      size: Math.abs(it.transform[3] as number) || (it.height as number) || 10,
    }));

  const lines: Line[] = [];
  let cur: typeof glyphs = [];
  let curY: number | null = null;
  const flush = () => {
    if (cur.length === 0) return;
    cur.sort((a, b) => a.x - b.x);
    const text = cur
      .map((g) => g.str)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      lines.push({
        text,
        x: Math.min(...cur.map((g) => g.x)),
        y: cur[0].y,
        size: Math.max(...cur.map((g) => g.size)),
      });
    }
    cur = [];
  };
  for (const g of glyphs) {
    if (curY === null || Math.abs(g.y - curY) <= Math.max(2, g.size * 0.5)) {
      cur.push(g);
      curY = curY === null ? g.y : (curY + g.y) / 2;
    } else {
      flush();
      cur = [g];
      curY = g.y;
    }
  }
  flush();
  return lines;
}

/** Turn lines into typed RawElements using font-size clustering + patterns. */
function classify(lines: Line[]): RawElement[] {
  // Round sizes and find the dominant (body) size.
  const freq = new Map<number, number>();
  for (const l of lines) {
    const s = Math.round(l.size);
    freq.set(s, (freq.get(s) ?? 0) + l.text.length);
  }
  const bodySize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  // Heading sizes: distinct sizes larger than body, ranked → levels 1..4.
  const bigger = [...new Set(lines.map((l) => Math.round(l.size)))]
    .filter((s) => s > bodySize + 1)
    .sort((a, b) => b - a);
  const levelOf = (size: number): number | null => {
    const s = Math.round(size);
    const idx = bigger.indexOf(s);
    if (idx === -1) return null;
    return Math.min(idx + 1, 4);
  };

  const out: RawElement[] = [];
  for (const l of lines) {
    const level = levelOf(l.size);
    if (level !== null) {
      out.push({ type: "heading", level, text: l.text });
      continue;
    }
    if (/^([•\-*‣▪·]|\d+[.)])\s+/.test(l.text)) {
      out.push({ type: "listitem", text: l.text.replace(/^([•\-*‣▪·]|\d+[.)])\s+/, "") });
      continue;
    }
    out.push({ type: "paragraph", text: l.text });
  }
  return mergeParagraphs(out);
}

/** Merge wrapped fragments: paragraphs split across lines, and multi-line headings. */
function mergeParagraphs(els: RawElement[]): RawElement[] {
  const out: RawElement[] = [];
  for (const el of els) {
    const prev = out[out.length - 1];
    if (
      el.type === "paragraph" &&
      prev?.type === "paragraph" &&
      !/[.!?:”"]$/.test(prev.text) &&
      prev.text.length < 240
    ) {
      prev.text = `${prev.text} ${el.text}`.replace(/\s+/g, " ").trim();
    } else if (
      el.type === "heading" &&
      prev?.type === "heading" &&
      prev.level === el.level &&
      prev.text.length < 80 &&
      !/^\s*[+\-−]?\d/.test(prev.text) &&
      !/^\s*[+\-−]?\d/.test(el.text)
    ) {
      // A heading that wrapped onto a second line (not two separate metrics).
      prev.text = `${prev.text} ${el.text}`.replace(/\s+/g, " ").trim();
    } else {
      out.push({ ...el });
    }
  }
  return out;
}
