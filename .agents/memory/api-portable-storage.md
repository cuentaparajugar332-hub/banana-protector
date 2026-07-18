---
name: api-portable-storage
description: Banana API storage is file-based JSON so it works on any host, not just Replit.
---

# API Storage

The Banana API stores uploaded Lua scripts in a local JSON file (`data/scripts.json`) instead of Replit Database.

**Why:** Replit Database (`@replit/database`) only works inside Replit. The user wanted the bot/API to be hostable anywhere.

**How to apply:** If you ever switch the storage backend back to a database, keep the same key format (`script:${slug}`) and value shape (`{ content, password, createdAt }`) so existing scripts keep loading.