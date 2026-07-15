import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { FileKind } from "./types.js";

export const WORK_DIR = join(process.cwd(), ".work");
export const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export class IngestError extends Error {}

/** Detect docx vs pdf from filename + magic bytes. */
export function detectKind(filename: string, buf: Buffer): FileKind {
  const lower = filename.toLowerCase();
  const isZip = buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  const isPdf = buf.length >= 5 && buf.toString("latin1", 0, 5) === "%PDF-";
  if (lower.endsWith(".pdf") || isPdf) {
    if (!isPdf) throw new IngestError("File claims to be PDF but is not a valid PDF.");
    return "pdf";
  }
  if (lower.endsWith(".docx") || isZip) {
    if (!isZip) throw new IngestError("File claims to be DOCX but is not a valid Office file.");
    return "docx";
  }
  throw new IngestError("Unsupported file type. Upload a .docx or .pdf.");
}

/** Persist an uploaded buffer to a per-job temp dir. */
export async function saveUpload(
  buf: Buffer,
  filename: string,
): Promise<{ jobId: string; path: string; kind: FileKind }> {
  if (buf.length === 0) throw new IngestError("Empty file.");
  if (buf.length > MAX_BYTES) throw new IngestError("File too large (max 25 MB).");
  const kind = detectKind(filename, buf);
  const jobId = randomUUID();
  const dir = join(WORK_DIR, jobId);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `input.${kind}`);
  await writeFile(path, buf);
  return { jobId, path, kind };
}
