import { readFile } from "node:fs/promises";
import mammoth from "mammoth";
import { parse, HTMLElement } from "node-html-parser";
import type { RawElement } from "../types.js";

/**
 * Convert a .docx into an ordered list of RawElements using mammoth (which maps
 * Word styles → clean semantic HTML) and a real HTML parser.
 */
export async function extractDocx(path: string): Promise<RawElement[]> {
  const buffer = await readFile(path);
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const b64 = await image.readAsBase64String();
        return { src: `data:${image.contentType};base64,${b64}` };
      }),
    },
  );
  const root = parse(html, { blockTextElements: { pre: true } });
  const out: RawElement[] = [];
  walk(root, out);
  return out.filter((e) => e.type === "image" || e.type === "table" || e.text.trim().length > 0);
}

function walk(node: HTMLElement, out: RawElement[]): void {
  for (const child of node.childNodes) {
    if (!(child instanceof HTMLElement)) continue;
    const tag = child.rawTagName?.toLowerCase();
    switch (tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        out.push({ type: "heading", level: Number(tag[1]), text: textOf(child) });
        break;
      case "p": {
        const img = child.querySelector("img");
        if (img && textOf(child).trim() === "") {
          out.push({ type: "image", text: "", src: img.getAttribute("src") ?? "" });
        } else {
          out.push({ type: "paragraph", text: textOf(child) });
        }
        break;
      }
      case "ul":
      case "ol":
        for (const li of child.querySelectorAll("li")) {
          out.push({ type: "listitem", text: textOf(li) });
        }
        break;
      case "blockquote":
        out.push({ type: "quote", text: textOf(child) });
        break;
      case "table": {
        const rows: string[][] = [];
        for (const tr of child.querySelectorAll("tr")) {
          rows.push(tr.querySelectorAll("th,td").map((c) => textOf(c)));
        }
        out.push({ type: "table", text: rows.map((r) => r.join(" ")).join(" "), rows });
        break;
      }
      case "img":
        out.push({ type: "image", text: "", src: child.getAttribute("src") ?? "" });
        break;
      default:
        // Recurse into wrappers/divs.
        walk(child, out);
    }
  }
}

function textOf(el: HTMLElement): string {
  return decodeEntities(el.text).replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
