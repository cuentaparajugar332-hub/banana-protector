---
name: bot-whitelist
description: Discord bot access control using env-var guild/user ID whitelists.
---

# Bot Whitelist

The Banana Bot uses environment variables for access control:

- `ALLOWED_GUILD_IDS` — comma-separated Discord server IDs
- `ALLOWED_USER_IDS` — comma-separated Discord user IDs

If neither is set, the bot accepts commands from anyone. If one or both are set, the caller must satisfy all configured checks.

**Why:** The bot is publicly registered and can be added to any server, so command access must be restricted server-side.

**How to apply:** Add IDs to the env vars in Replit. Restart the bot workflow after changes. IDs are public identifiers, not secrets, so they live in `shared` env vars.