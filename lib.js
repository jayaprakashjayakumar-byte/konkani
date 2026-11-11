// Shared helpers: CSV parse/write, polygon parse/format, data loading, validation.
const Lib = (() => {
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = []; let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = ""; rows.push(row); row = [];
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const clean = rows.filter(r => r.some(v => v.trim() !== ""));
    if (!clean.length) return [];
    const head = clean[0].map(h => h.trim().toLowerCase());
    return clean.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  }
  function csvCell(v) {
    v = String(v ?? "");
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function toCSV(rows, headers) {
    return [headers.join(","), ...rows.map(r => headers.map(h => csvCell(r[h])).join(","))].join("\n") + "\n";
  }
  function parsePolygon(s) {
    if (!s) return null;
    const pts = s.trim().split(/\s+/).map(p => p.split(",").map(Number));
    if (pts.length < 3 || pts.some(p => p.length !== 2 || p.some(n => !isFinite(n) || n < 0 || n > 1))) return null;
    return pts;
  }
  const formatPolygon = pts => pts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ");
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
    if (Math.abs(a) < 1e-9) return pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
    return [cx / (3 * a), cy / (3 * a)];
  }
  async function fetchText(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`${url} returned ${r.status}`);
    return r.text();
  }
  async function loadAll(cfg) {
    const [lex, hot, sc] = await Promise.all([cfg.lexicon, cfg.hotspots, cfg.scenes].map(fetchText));
    return { lexicon: parseCSV(lex), hotspots: parseCSV(hot), scenes: parseCSV(sc) };
  }
  const STATUSES = ["draft", "verified", "published"];
  const CONFIDENCE = ["attested", "proposed", "speculative", ""];
  function validate({ lexicon, hotspots, scenes }) {
    const issues = [];
    const add = (where, msg) => issues.push({ where, msg });
    const sceneIds = new Set(), hotIds = new Set(), wordIds = new Set();
    scenes.forEach((s, i) => {
      if (!s.scene_id) add(`scenes row ${i + 2}`, "Missing scene_id");
      else if (sceneIds.has(s.scene_id)) add(`scenes row ${i + 2}`, `Duplicate scene_id ${s.scene_id}`);
      sceneIds.add(s.scene_id);
      if (!s.image) add(`scenes row ${i + 2}`, "Missing image path");
    });
    hotspots.forEach((h, i) => {
      const w = `hotspots row ${i + 2}`;
      if (!h.hotspot_id) add(w, "Missing hotspot_id");
      else if (hotIds.has(h.hotspot_id)) add(w, `Duplicate hotspot_id ${h.hotspot_id}`);
      hotIds.add(h.hotspot_id);
      if (!sceneIds.has(h.scene_id)) add(w, `scene_id "${h.scene_id}" is not in scenes`);
      if (!parsePolygon(h.polygon)) add(w, `Polygon for ${h.hotspot_id || "?"} is invalid (need 3+ points, values 0–1)`);
    });
    lexicon.forEach((r, i) => {
      const w = `lexicon row ${i + 2}${r.word_id ? " (" + r.word_id + ")" : ""}`;
      if (!r.word_id) add(w, "Missing word_id");
      else if (wordIds.has(r.word_id)) add(w, `Duplicate word_id ${r.word_id}`);
      wordIds.add(r.word_id);
      if (!STATUSES.includes((r.status || "").toLowerCase())) add(w, `Status "${r.status}" must be draft, verified or published`);
      if (!r.romanized) add(w, "Missing romanized headword");
      if (!r.meaning) add(w, "Missing meaning");
      if (r.hotspot_id && !hotIds.has(r.hotspot_id)) add(w, `hotspot_id "${r.hotspot_id}" is not in hotspots`);
      if (!CONFIDENCE.includes((r.confidence || "").toLowerCase())) add(w, `Confidence "${r.confidence}" must be attested, proposed or speculative`);
      if (r.etymology && !r.source) add(w, "Etymology given without a source");
      const g = (r.game || "").toLowerCase();
      if (!["yes", "y", "true", "1", "no", "n", "false", "0", ""].includes(g)) add(w, `game "${r.game}" must be yes, no or blank`);
      if (["yes", "y", "true", "1"].includes(g) && !r.thumb && (r.status || "").toLowerCase() === "published") add(w, "In the match game but has no thumb image, so the game shows its meaning as text");
    });
    return issues;
  }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return { parseCSV, toCSV, parsePolygon, formatPolygon, centroid, loadAll, validate, esc, fetchText };
})();
