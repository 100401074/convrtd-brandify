import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { chromium } from "playwright";
import { BATCH_1, BATCH_2, type SampleDoc } from "./sample-content.js";

const OUT = join(process.cwd(), "samples", "inputs");

async function buildDocx(doc: SampleDoc): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }));
  if (doc.subtitle) children.push(new Paragraph({ text: doc.subtitle }));
  for (const sec of doc.sections) {
    children.push(new Paragraph({ text: sec.heading, heading: HeadingLevel.HEADING_1 }));
    for (const p of sec.paras ?? []) children.push(new Paragraph({ text: p }));
    for (const b of sec.bullets ?? []) children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
    for (const s of sec.stats ?? []) children.push(new Paragraph({ text: `${s.value} — ${s.label}` }));
  }
  const document = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(document));
}

function plainHtml(doc: SampleDoc): string {
  const secHtml = doc.sections
    .map((sec) => {
      const paras = (sec.paras ?? []).map((p) => `<p>${esc(p)}</p>`).join("");
      const bullets = sec.bullets?.length
        ? `<ul>${sec.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
        : "";
      const stats = (sec.stats ?? []).map((s) => `<p class="stat">${esc(s.value)} — ${esc(s.label)}</p>`).join("");
      return `<h2>${esc(sec.heading)}</h2>${paras}${bullets}${stats}`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:'Times New Roman',Georgia,serif;color:#111;margin:0;padding:26mm 22mm;font-size:12pt;line-height:1.5;}
    h1{font-size:23pt;margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;}
    .sub{font-size:13pt;color:#333;margin:0 0 22px;font-style:italic;}
    h2{font-size:15pt;margin:20px 0 6px;font-family:Arial,Helvetica,sans-serif;}
    p{margin:0 0 10px;} ul{margin:0 0 12px 20px;} li{margin:0 0 5px;}
    .stat{font-size:14pt;font-weight:bold;}
  </style></head><body>
    <h1>${esc(doc.title)}</h1>${doc.subtitle ? `<p class="sub">${esc(doc.subtitle)}</p>` : ""}${secHtml}
  </body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const batch = process.argv[2] === "2" ? BATCH_2 : process.argv[2] === "all" ? [...BATCH_1, ...BATCH_2] : BATCH_1;
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const doc of batch) {
      if (doc.format === "docx") {
        await writeFile(join(OUT, `${doc.name}.docx`), await buildDocx(doc));
      } else {
        const page = await browser.newPage();
        await page.setContent(plainHtml(doc), { waitUntil: "networkidle" });
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        await writeFile(join(OUT, `${doc.name}.pdf`), pdf);
        await page.close();
      }
      console.log("made", doc.name, `(${doc.format})`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
