import type { Block } from "../types.js";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Wrap the last word of a heading in the indigo accent span (the signature move).
 * Only applied to multi-word headings — a single-word heading stays ink so indigo
 * remains a punctuating signal, never a flood.
 */
export function lastWordIndigo(text: string): string {
  const t = text.trim();
  const words = t.split(/\s+/);
  if (words.length < 2) return esc(t);
  const last = words.pop() as string;
  return `${esc(words.join(" "))} <span class="lw">${esc(last)}</span>`;
}

/** Render a run of blocks, grouping consecutive stats into one stat grid. */
export function renderBlocks(blocks: Block[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "stat") {
      const group: Block[] = [];
      while (i < blocks.length && blocks[i].type === "stat") group.push(blocks[i++]);
      out.push(renderStats(group));
      continue;
    }
    out.push(renderBlock(b));
    i++;
  }
  return out.join("\n");
}

function renderStats(group: Block[]): string {
  const cards = group
    .map(
      (s) =>
        `<div class="stat"><div class="v">${esc(s.value ?? "")}</div>${
          s.label ? `<div class="l">${esc(s.label)}</div>` : ""
        }</div>`,
    )
    .join("");
  return `<div class="stats avoid-break">${cards}</div>`;
}

function renderBlock(b: Block): string {
  switch (b.type) {
    case "paragraph":
      return `<p class="body">${esc(b.text ?? "")}</p>`;
    case "heading":
      return `<h3 class="h3">${esc(b.text ?? "")}</h3>`;
    case "list":
      return `<ul class="list">${(b.items ?? []).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`;
    case "quote":
      return `<blockquote class="quote avoid-break"><p>${esc(b.text ?? "")}</p></blockquote>`;
    case "callout":
      return `<div class="callout avoid-break"><p>${esc(b.text ?? "")}</p></div>`;
    case "image":
      return b.src ? `<figure class="figure avoid-break"><img src="${b.src}" /></figure>` : "";
    case "table":
      return renderTable(b);
    case "stat":
      return renderStats([b]);
    default:
      return "";
  }
}

function renderTable(b: Block): string {
  const rows = b.rows ?? [];
  if (rows.length === 0) return "";
  const [head, ...body] = rows;
  const thead = `<thead><tr>${head.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<table class="brand avoid-break">${thead}${tbody}</table>`;
}
