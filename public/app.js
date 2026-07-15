const $ = (s) => document.querySelector(s);
const opts = { mode: "rebuild", theme: "charcoal", pageSize: "A4" };
let currentFile = null;
let es = null;

const MODE_HINTS = {
  rebuild: "Rebuild — lay the content onto branded pages.",
  restyle: "Restyle — keep the original order, apply the brand skin.",
};
const THEME_HINTS = {
  charcoal: "Charcoal — the brand's dominant dark.",
  ivory: "Ivory — light surface, charcoal ink.",
};
const STEP_ORDER = ["extract", "structure", "compose", "render", "upload"];

// Segmented controls
document.querySelectorAll(".seg").forEach((seg) => {
  const name = seg.dataset.name;
  seg.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      seg.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      opts[name] = btn.dataset.val;
      if (name === "mode") $("#mode-hint").textContent = MODE_HINTS[opts.mode];
      if (name === "theme") $("#theme-hint").textContent = THEME_HINTS[opts.theme];
    });
  });
});

// File selection + drag/drop
const drop = $("#drop");
const fileInput = $("#file");

function setFile(file) {
  if (!file) return;
  if (!/\.(docx|pdf)$/i.test(file.name)) return setStatus("Please choose a .docx or .pdf file.", true);
  if (file.size > 25 * 1024 * 1024) return setStatus("File is larger than 25 MB.", true);
  currentFile = file;
  $("#fname").textContent = file.name;
  drop.classList.add("filled");
  $("#go").disabled = false;
  setStatus("");
}
fileInput.addEventListener("change", (e) => setFile(e.target.files[0]));
["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("hot"); }),
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("hot"); }),
);
drop.addEventListener("drop", (e) => setFile(e.dataTransfer.files[0]));

function setStatus(msg, err) {
  const s = $("#status");
  s.textContent = msg || "";
  s.classList.toggle("err", !!err);
}

function updateSteps(stage, pct) {
  const idx = STEP_ORDER.indexOf(stage);
  document.querySelectorAll("#steps li").forEach((li, i) => {
    li.classList.remove("active", "done");
    if (pct >= 100) li.classList.add("done");
    else if (idx === -1) return;
    else if (i < idx) li.classList.add("done");
    else if (i === idx) li.classList.add("active");
  });
}

function showProgress(on) {
  $("#panel").hidden = on;
  $("#progress-card").hidden = !on;
}

// Submit → create job → stream progress
$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentFile) return;
  setStatus("");
  $("#result").hidden = true;
  showProgress(true);
  $("#bar-fill").style.width = "2%";
  $("#progress-pct").textContent = "0%";
  $("#progress-label").textContent = "Uploading your document…";
  updateSteps("", 0);

  try {
    const fd = new FormData();
    fd.append("mode", opts.mode);
    fd.append("theme", opts.theme);
    fd.append("pageSize", opts.pageSize);
    fd.append("file", currentFile);
    const res = await fetch("/api/jobs", { method: "POST", body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Could not start generation.");
    }
    const { jobId } = await res.json();
    streamJob(jobId);
  } catch (err) {
    showProgress(false);
    setStatus(err.message, true);
  }
});

function streamJob(jobId) {
  if (es) es.close();
  es = new EventSource(`/api/jobs/${jobId}/stream`);
  es.onmessage = (ev) => {
    const d = JSON.parse(ev.data);
    if (d.status === "error") {
      es.close();
      showProgress(false);
      setStatus(d.error || "Generation failed.", true);
      return;
    }
    const pct = d.progress?.pct ?? 0;
    $("#bar-fill").style.width = `${pct}%`;
    $("#progress-pct").textContent = `${Math.round(pct)}%`;
    $("#progress-label").textContent = (d.progress?.label || "Working") + "…";
    updateSteps(d.progress?.stage, pct);

    if (d.status === "done") {
      es.close();
      finish(d);
    }
  };
  es.onerror = () => {
    es.close();
    showProgress(false);
    setStatus("Connection lost. Please try again.", true);
  };
}

function finish(d) {
  $("#progress-card").hidden = true;
  $("#panel").hidden = true;
  const dl = $("#download");
  dl.href = d.downloadPath;
  dl.setAttribute("download", d.filename || "document-CONVRTD.pdf");
  $("#result-meta").textContent =
    `${opts.mode} · ${opts.theme} · ${opts.pageSize}` +
    (d.hasR2 ? " · hosted on Cloudflare (link valid 7 days)" : "");
  const prev = $("#preview");
  prev.src = d.downloadPath;
  prev.hidden = false;
  $("#result").hidden = false;
  $("#result").scrollIntoView({ behavior: "smooth" });
}

// Reset
$("#reset").addEventListener("click", () => {
  currentFile = null;
  fileInput.value = "";
  drop.classList.remove("filled");
  $("#fname").textContent = "Drop your .docx or .pdf here";
  $("#go").disabled = true;
  $("#result").hidden = true;
  $("#panel").hidden = false;
  setStatus("");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
