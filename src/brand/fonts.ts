import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "fonts");

const FACES: Array<{ family: string; weight: number; file: string; style?: string }> = [
  { family: "Satoshi", weight: 300, file: "satoshi-300.woff2" },
  { family: "Satoshi", weight: 400, file: "satoshi-400.woff2" },
  { family: "Satoshi", weight: 500, file: "satoshi-500.woff2" },
  { family: "Satoshi", weight: 700, file: "satoshi-700.woff2" },
  { family: "Satoshi", weight: 900, file: "satoshi-900.woff2" },
  { family: "Inter", weight: 400, file: "inter-400.woff2" },
  { family: "Inter", weight: 500, file: "inter-500.woff2" },
  { family: "Inter", weight: 700, file: "inter-700.woff2" },
];

let cache: string | null = null;

/** Build @font-face rules with base64-embedded woff2 so fonts survive setContent(). */
export async function fontFaceCss(): Promise<string> {
  if (cache) return cache;
  const rules = await Promise.all(
    FACES.map(async (f) => {
      const b64 = (await readFile(join(FONT_DIR, f.file))).toString("base64");
      return `@font-face{font-family:'${f.family}';font-style:${f.style ?? "normal"};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    }),
  );
  cache = rules.join("\n");
  return cache;
}
