import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./pipeline.js";
import { IngestError } from "./ingest.js";
import { createJob, getJob, setProgress, setDone, setError, subscribe } from "./jobs.js";
import { isR2Configured, uploadPdf } from "./r2.js";
import type { Mode, Theme, PageSize } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5178;

const app = Fastify({ bodyLimit: 30 * 1024 * 1024, logger: { level: "info" } });
await app.register(multipart, { limits: { fileSize: 26 * 1024 * 1024 } });
await app.register(fastifyStatic, { root: join(__dirname, "..", "public") });

function pick<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return typeof v === "string" && allowed.includes(v as T) ? (v as T) : fallback;
}
const outName = (filename: string) => filename.replace(/\.(docx|pdf)$/i, "") + "-CONVRTD.pdf";

/** Async, progress-tracked generation used by the web UI. Returns a job id. */
app.post("/api/jobs", async (req, reply) => {
  const file = await req.file();
  if (!file) return reply.code(400).send({ error: "No file uploaded." });
  const fields = file.fields as Record<string, { value?: string } | undefined>;
  const mode = pick<Mode>(fields.mode?.value, ["rebuild", "restyle"], "rebuild");
  const theme = pick<Theme>(fields.theme?.value, ["charcoal", "ivory"], "charcoal");
  const pageSize = pick<PageSize>(fields.pageSize?.value, ["A4", "Letter"], "A4");
  const filename = file.filename;
  const buf = await file.toBuffer();

  const job = createJob();
  // Process in the background; the client follows /api/jobs/:id/stream.
  void (async () => {
    try {
      const { pdf } = await generate(buf, filename, { mode, theme, pageSize }, (stage, label, pct) =>
        setProgress(job.id, { stage, label, pct }),
      );
      const download = outName(filename);
      if (isR2Configured()) {
        setProgress(job.id, { stage: "upload", label: "Uploading to Cloudflare", pct: 90 });
        const key = `${new Date().toISOString().slice(0, 10)}/${job.id}/${download}`;
        const url = await uploadPdf(pdf, key, download);
        setDone(job.id, { filename: download, downloadUrl: url });
      } else {
        setDone(job.id, { filename: download, pdf });
      }
    } catch (err) {
      const msg = err instanceof IngestError ? err.message : (err as Error).message;
      req.log.error(err);
      setError(job.id, msg || "Generation failed.");
    }
  })();

  return reply.send({ jobId: job.id });
});

/** Server-Sent Events stream of job progress. */
app.get<{ Params: { id: string } }>("/api/jobs/:id/stream", (req, reply) => {
  const job = getJob(req.params.id);
  if (!job) return reply.code(404).send({ error: "Unknown job." });

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  reply.raw.write(": connected\n\n");
  const ping = setInterval(() => reply.raw.write(": ping\n\n"), 15000);

  const unsub = subscribe(req.params.id, (j) => {
    const payload = {
      status: j.status,
      progress: j.progress,
      filename: j.filename,
      hasR2: Boolean(j.downloadUrl),
      downloadPath: j.status === "done" ? `/api/download/${j.id}` : undefined,
      error: j.error,
    };
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (j.status === "done" || j.status === "error") {
      clearInterval(ping);
      reply.raw.end();
    }
  });

  req.raw.on("close", () => {
    clearInterval(ping);
    unsub();
  });
});

/** Download endpoint — redirects to the Cloudflare URL, or streams the held PDF. */
app.get<{ Params: { id: string } }>("/api/download/:id", async (req, reply) => {
  const job = getJob(req.params.id);
  if (!job || job.status !== "done") return reply.code(404).send({ error: "Not ready." });
  if (job.downloadUrl) return reply.redirect(job.downloadUrl);
  if (job.pdf) {
    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${job.filename}"`)
      .send(job.pdf);
  }
  return reply.code(410).send({ error: "This file has expired." });
});

/** Synchronous endpoint — returns the PDF directly (used by n8n / integrations). */
app.post("/api/generate", async (req, reply) => {
  const file = await req.file();
  if (!file) return reply.code(400).send({ error: "No file uploaded." });
  const fields = file.fields as Record<string, { value?: string } | undefined>;
  const mode = pick<Mode>(fields.mode?.value, ["rebuild", "restyle"], "rebuild");
  const theme = pick<Theme>(fields.theme?.value, ["charcoal", "ivory"], "charcoal");
  const pageSize = pick<PageSize>(fields.pageSize?.value, ["A4", "Letter"], "A4");
  const buf = await file.toBuffer();
  try {
    const { pdf, structureSource, sections } = await generate(buf, file.filename, {
      mode,
      theme,
      pageSize,
    });
    reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `inline; filename="${outName(file.filename)}"`)
      .header("X-Structure-Source", structureSource)
      .header("X-Sections", String(sections))
      .send(pdf);
  } catch (err) {
    const msg = err instanceof IngestError ? err.message : (err as Error).message;
    req.log.error(err);
    return reply.code(400).send({ error: msg });
  }
});

app.get("/api/health", async () => ({ ok: true, r2: isR2Configured() }));

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => console.log(`CONVRTD Brandify on http://localhost:${PORT} (r2=${isR2Configured()})`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
