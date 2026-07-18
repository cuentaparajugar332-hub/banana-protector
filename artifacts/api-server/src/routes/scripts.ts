import { Router, type Request, type Response } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");
const SCRIPTS_FILE = join(DATA_DIR, "scripts.json");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadScripts(): Record<string, { content: string; password?: string; createdAt: string }> {
  if (!existsSync(SCRIPTS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SCRIPTS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveScripts(scripts: Record<string, { content: string; password?: string; createdAt: string }>) {
  writeFileSync(SCRIPTS_FILE, JSON.stringify(scripts, null, 2), "utf-8");
}

function generateSlug(): string {
  return randomBytes(5).toString("hex"); // 10 hex chars
}

export function createScript(content: string, password?: string): string {
  const scripts = loadScripts();
  let slug = generateSlug();
  // Avoid collisions
  while (scripts[slug]) slug = generateSlug();
  scripts[slug] = { content, password, createdAt: new Date().toISOString() };
  saveScripts(scripts);
  return slug;
}

const router = Router();

// GET /api/s/:slug — public script serving (blocks browsers)
const BLOCKED_PAGE = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Blocked</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0d;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif}.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:48px 56px;text-align:center;max-width:420px}.icon{font-size:64px;margin-bottom:20px}h1{color:#e0e0e0;font-size:22px;font-weight:600;letter-spacing:2px;margin-bottom:12px;text-transform:uppercase}p{color:#666;font-size:14px;line-height:1.6}.brand{margin-top:24px;font-size:11px;color:#333;letter-spacing:1px;text-transform:uppercase}</style></head><body><div class="card"><div class="icon">🚫</div><h1>You are blocked</h1><p>You can't get this code</p><div class="brand">Banana API Protection</div></div></body></html>`;

const BAD_BOTS = [/bot/i, /crawler/i, /spider/i, /scraper/i, /zgrab/i, /nuclei/i, /masscan/i, /nmap/i, /sqlmap/i, /nikto/i, /dirbuster/i, /gobuster/i, /wfuzz/i];

function blockBrowsers(req: Request, res: Response, next: () => void): void {
  const ua = req.headers["user-agent"] || "";
  if (!ua) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  if (BAD_BOTS.some((p) => p.test(ua))) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  const uaLower = ua.toLowerCase();
  const isBrowser =
    (uaLower.includes("chrome/") || uaLower.includes("firefox/") || uaLower.includes("safari/") ||
     uaLower.includes("edge/") || uaLower.includes("opr/") || uaLower.includes("trident/")) &&
    uaLower.includes("mozilla");
  if (isBrowser) { res.status(403).type("html").send(BLOCKED_PAGE); return; }
  next();
}

router.get("/:slug", blockBrowsers, (req: Request, res: Response) => {
  const { slug } = req.params;
  const scripts = loadScripts();
  const script = scripts[slug];

  if (!script) {
    res.status(404).type("text").send("Script not found");
    return;
  }

  // Password check
  if (script.password) {
    const pw =
      (req.query["pw"] as string | undefined) ||
      req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
    if (!pw || pw !== script.password) {
      res.status(401).type("text").send("Invalid or missing password. Pass ?pw=<password>");
      return;
    }
  }

  res.type("text").send(script.content);
});

// POST /api/s — bot-only script creation (requires BOT_API_KEY header)
router.post("/", (req: Request, res: Response) => {
  const botKey = process.env.BOT_API_KEY;
  const providedKey = req.headers["x-bot-key"] as string | undefined;

  if (!botKey || providedKey !== botKey) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { content, password } = req.body as { content?: string; password?: string };

  if (!content || typeof content !== "string" || content.trim() === "") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const slug = createScript(content.trim(), password || undefined);

  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = `${proto}://${host}/api/s/${slug}`;

  res.status(201).json({ slug, url });
});

export default router;
