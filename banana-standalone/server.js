// Banana Protector API Server
// Runs anywhere with Node.js + Express. Scripts are stored in a local JSON file.

const express = require("express");
const { randomBytes } = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "2mb" }));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "scripts.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function generateSlug() {
  return randomBytes(5).toString("hex");
}

function buildUrl(req, slug) {
  const base = process.env.API_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}/api/s/${slug}`;
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}/api/s/${slug}`;
}

const BLOCKED_PAGE = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Blocked</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0d;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif}.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:48px 56px;text-align:center;max-width:420px}.icon{font-size:64px;margin-bottom:20px}h1{color:#e0e0e0;font-size:22px;font-weight:600;letter-spacing:2px;margin-bottom:12px;text-transform:uppercase}p{color:#666;font-size:14px;line-height:1.6}.brand{margin-top:24px;font-size:11px;color:#333;letter-spacing:1px;text-transform:uppercase}</style></head><body><div class="card"><div class="icon">🚫</div><h1>You are blocked</h1><p>You can't get this code</p><div class="brand">Banana API Protection</div></div></body></html>`;

const BAD_BOTS = [/bot/i, /crawler/i, /spider/i, /scraper/i, /zgrab/i, /nuclei/i, /masscan/i, /nmap/i, /sqlmap/i, /nikto/i, /dirbuster/i, /gobuster/i, /wfuzz/i];

function blockBrowsers(req, res, next) {
  const ua = req.headers["user-agent"] || "";
  if (!ua) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  if (BAD_BOTS.some((p) => p.test(ua))) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  const uaLower = ua.toLowerCase();
  const isBrowser = (uaLower.includes("chrome/") || uaLower.includes("firefox/") || uaLower.includes("safari/") || uaLower.includes("edge/") || uaLower.includes("opr/") || uaLower.includes("trident/")) && uaLower.includes("mozilla");
  if (isBrowser) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  next();
}

app.get("/api/s/:slug", blockBrowsers, (req, res) => {
  const db = loadDb();
  const record = db[`script:${req.params.slug}`];
  if (!record) return res.status(404).type("text").send("Script not found");

  if (record.password) {
    const pw = req.query.pw || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!pw || pw !== record.password) return res.status(401).type("text").send("Invalid or missing password. Pass ?pw=<password>");
  }

  res.type("text").send(record.content || "");
});

app.post("/api/s", (req, res) => {
  const botKey = process.env.BOT_API_KEY;
  const providedKey = req.headers["x-bot-key"];
  if (!botKey || providedKey !== botKey) return res.status(403).json({ error: "Forbidden" });

  const { content, password } = req.body;
  if (!content || typeof content !== "string" || content.trim() === "") return res.status(400).json({ error: "content is required" });

  const db = loadDb();
  let slug = generateSlug();
  while (db[`script:${slug}`]) slug = generateSlug();

  db[`script:${slug}`] = { content: content.trim(), password: password || null, createdAt: new Date().toISOString() };
  saveDb(db);

  res.status(201).json({ slug, url: buildUrl(req, slug) });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Banana API listening on port ${PORT}`));