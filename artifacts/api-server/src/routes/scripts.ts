import { Router, type Request, type Response } from "express";
import Client from "@replit/database";
import { randomBytes } from "crypto";

const db = new Client();

async function dbGet(key: string): Promise<any> {
  const result = await db.get(key);
  return result.ok ? result.value : null;
}

async function dbSet(key: string, value: any): Promise<void> {
  const result = await db.set(key, value);
  if (!result.ok) throw new Error(result.error?.message || "Failed to save to database");
}

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

function generateSlug(): string {
  return randomBytes(5).toString("hex");
}

function buildUrl(req: Request, slug: string): string {
  // If you want a fixed custom domain (e.g. https://api.h4xscripts.xyz), set API_BASE_URL.
  const base = process.env.API_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}/api/s/${slug}`;

  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}/api/s/${slug}`;
}

export async function createScript(content: string, password?: string): Promise<string> {
  let slug = generateSlug();
  let existing = await dbGet(`script:${slug}`);
  let attempts = 0;
  while (existing && attempts < 10) {
    slug = generateSlug();
    existing = await dbGet(`script:${slug}`);
    attempts++;
  }
  if (existing) throw new Error("Could not generate unique slug");

  await dbSet(`script:${slug}`, { content, password: password || null, createdAt: new Date().toISOString() });
  return slug;
}

const router = Router();

// GET /api/s/:slug — public script serving (blocks browsers)
router.get("/:slug", blockBrowsers, async (req: Request, res: Response) => {
  const { slug } = req.params;
  const record = await dbGet(`script:${slug}`);

  if (!record || typeof record !== "object") {
    res.status(404).type("text").send("Script not found");
    return;
  }

  const { content, password } = record as { content?: string; password?: string | null };

  if (password) {
    const pw =
      (req.query["pw"] as string | undefined) ||
      req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
    if (!pw || pw !== password) {
      res.status(401).type("text").send("Invalid or missing password. Pass ?pw=<password>");
      return;
    }
  }

  res.type("text").send(content || "");
});

// POST /api/s — bot-only script creation (requires BOT_API_KEY header)
router.post("/", async (req: Request, res: Response) => {
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

  try {
    const slug = await createScript(content.trim(), password || undefined);
    res.status(201).json({ slug, url: buildUrl(req, slug) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
