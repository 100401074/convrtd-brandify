import { randomUUID } from "node:crypto";

export interface JobProgress {
  stage: string;
  label: string;
  pct: number;
}

export interface Job {
  id: string;
  status: "processing" | "done" | "error";
  progress: JobProgress;
  filename?: string;
  downloadUrl?: string; // set when R2-hosted
  pdf?: Buffer; // held for local-download fallback
  error?: string;
  createdAt: number;
  listeners: Set<(job: Job) => void>;
}

const jobs = new Map<string, Job>();
const TTL_MS = 30 * 60 * 1000; // keep finished jobs 30 min

export function createJob(): Job {
  const job: Job = {
    id: randomUUID(),
    status: "processing",
    progress: { stage: "queued", label: "Queued", pct: 2 },
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(job.id, job);
  sweep();
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

function emit(job: Job) {
  for (const fn of job.listeners) {
    try {
      fn(job);
    } catch {
      /* ignore listener errors */
    }
  }
}

export function setProgress(id: string, progress: JobProgress) {
  const job = jobs.get(id);
  if (!job || job.status !== "processing") return;
  job.progress = progress;
  emit(job);
}

export function setDone(id: string, opts: { filename: string; downloadUrl?: string; pdf?: Buffer }) {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "done";
  job.filename = opts.filename;
  job.downloadUrl = opts.downloadUrl;
  job.pdf = opts.pdf;
  job.progress = { stage: "done", label: "Ready", pct: 100 };
  emit(job);
}

export function setError(id: string, error: string) {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "error";
  job.error = error;
  emit(job);
}

/** Subscribe to job updates; immediately pushes current state. Returns unsubscribe. */
export function subscribe(id: string, fn: (job: Job) => void): () => void {
  const job = jobs.get(id);
  if (!job) return () => {};
  job.listeners.add(fn);
  fn(job);
  return () => job.listeners.delete(fn);
}

function sweep() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id);
  }
}
