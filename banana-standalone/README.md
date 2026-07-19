# Banana Protector — Standalone

Bot de Discord + API para subir scripts Lua y generar loadstrings. Funciona en cualquier servidor con Node.js. No depende de Replit.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Configuración

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

Variables importantes:

- `DISCORD_TOKEN` — token del bot de Discord
- `DISCORD_CLIENT_ID` — ID de la aplicación de Discord
- `BOT_API_KEY` — clave que usa el bot para autenticarse con la API
- `API_BASE_URL` — dominio público donde está hosteada la API (ej: `https://api.tudominio.com`)
- `API_URL` — URL interna que usa el bot para hablar con la API (por defecto `http://localhost:3000`)
- `ALLOWED_GUILD_IDS` — IDs de servidores permitidos (opcional)
- `ALLOWED_USER_IDS` — IDs de usuarios permitidos (opcional)

## Uso

### 1. Iniciar la API

```bash
npm run start:api
```

La API escucha en el puerto `PORT` (por defecto 3000). Los scripts se guardan en `data/scripts.json`.

### 2. Registrar los comandos slash

Solo necesitás hacerlo una vez, o cada vez que cambies los comandos:

```bash
npm run deploy
```

### 3. Iniciar el bot

En otra terminal:

```bash
npm run start:bot
```

## Comandos de Discord

- `/api_url` — sube código Lua y devuelve un loadstring
- `/make_file` — genera un archivo `.lua`
- `/help` — muestra la ayuda

## Hosteo en Railway (recomendado)

1. Andá a [railway.app](https://railway.app) y creá una cuenta.
2. Creá un nuevo proyecto.
3. Subí el zip de esta carpeta (`banana-standalone`).
4. Railway detecta el `package.json` y usa `npm start` (que corre `node server.js`, la API).
5. Copiá el **public URL** de la API (algo como `https://api-production-abc.up.railway.app`).
6. Andá a **Variables** y agregá todas las variables que están en `.env.example`.
7. La API ya está corriendo. Ahora agregá un segundo servicio para el bot:
   - En el proyecto, clic en **New** → **Empty Service**.
   - Usá el mismo repo/código.
   - Seteá el **Start Command** como `npm run start:bot`.
   - En las variables de este servicio, `API_URL` debe ser la URL pública de la API del paso 5.
8. En el servicio del bot, ejecutá una vez `npm run deploy` para registrar los comandos slash.
9. Listo.

### Variables para Railway

| Variable | Valor | Servicio |
|----------|-------|----------|
| `DISCORD_TOKEN` | Tu token de bot | Bot |
| `DISCORD_CLIENT_ID` | ID de tu app de Discord | Bot |
| `BOT_API_KEY` | Cualquier string largo aleatorio | API y Bot |
| `API_BASE_URL` | URL pública de la API (paso 5) | API |
| `API_URL` | URL pública de la API | Bot |
| `ALLOWED_GUILD_IDS` | IDs de servidores permitidos | Bot |
| `ALLOWED_USER_IDS` | IDs de usuarios permitidos | Bot |

## Hosteo alternativo

- **Render**: subí el proyecto y usá `npm start` para la API, y otro servicio para el bot.
- **VPS**: corré la API con `pm2` o `systemd`, apuntá tu dominio a la IP, y el bot en la misma máquina o en otra.
- **Replit**: también funciona, pero ahora no depende de Replit Database.

## Dominio personalizado

1. Hosteá la API en un servidor con IP pública.
2. Apuntá `api.tudominio.com` a esa IP.
3. Seteá `API_BASE_URL=https://api.tudominio.com`.
4. El bot debe poder llegar a la API vía `API_URL`.