# Banana Protector — Standalone

Bot de Discord + API para subir scripts Lua y generar loadstrings. Funciona en cualquier servidor con Node.js. No depende de Replit.

## Estructura de archivos

```
banana-standalone/
├── server.js              # API Express (almacena scripts en data/scripts.json)
├── bot.js                 # Bot de Discord (comandos /api_url, /make_file, /help)
├── obfuscator.js          # Obfuscador Banana Protector (editá este archivo para cambiar la protección)
├── deploy-commands.js     # Registra los comandos slash en Discord
├── package.json           # Dependencias y scripts
├── .env.example           # Variables de entorno de ejemplo
├── render.yaml            # Configuración para Render (dos servicios: API + Bot)
└── README.md              # Esta guía
```

## Requisitos

- Node.js 18+
- npm

## Instalación local

```bash
npm install
cp .env.example .env
# Editá .env con tus valores
npm run start:api   # en una terminal
npm run start:bot   # en otra terminal
npm run deploy      # una sola vez para registrar comandos slash
```

## Variables de entorno

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Bot | Token del bot de Discord. [Guía](https://discordjs.guide/preparations/setting-up-a-bot-application.html) |
| `DISCORD_CLIENT_ID` | Bot | ID de la aplicación de Discord (misma que el bot). |
| `BOT_API_KEY` | API y Bot | Clave secreta que usa el bot para hablar con la API. Usá la misma en ambos. |
| `API_BASE_URL` | API | URL pública donde está hosteada la API. Es la URL que aparece en los loadstrings. |
| `API_URL` | Bot | URL que usa el bot para mandar scripts a la API. Suele ser la misma que `API_BASE_URL`. |
| `ALLOWED_GUILD_IDS` | Bot | IDs de servidores de Discord permitidos (opcional). |
| `ALLOWED_USER_IDS` | Bot | IDs de usuarios de Discord permitidos (opcional). |
| `DATA_DIR` | API | Carpeta donde se guardan los scripts. Por defecto `./data`. |

## Cómo funciona

1. El usuario escribe `/api_url` en Discord.
2. El bot recibe el comando, puede ofuscar el código con `obfuscator.js`.
3. El bot manda el código a la API (`server.js`) usando `BOT_API_KEY`.
4. La API guarda el script en `data/scripts.json` y genera un slug único.
5. La API responde con una URL pública: `https://tudominio.com/api/s/<slug>`.
6. El bot arma el loadstring: `loadstring(game:HttpGet("URL",true))()`.
7. Cualquiera que tenga el loadstring puede descargar el script desde la API.
8. La API bloquea navegadores con `User-Agent` para evitar que vean el código directamente.

## Comandos de Discord

- `/api_url` — sube Lua y devuelve un loadstring URL.
  - `code`: código pegado directamente.
  - `file`: archivo `.lua` o `.txt`.
  - `obfuscation`: `true` para proteger con Banana Protector.
  - `password`: contraseña para acceder al script.
- `/make_file` — genera un archivo `.lua` descargable.
  - `code`: código obligatorio.
  - `url`: envuelve la URL en un loadstring automáticamente.
- `/help` — muestra la ayuda.

## Obfuscador

Todo el código de protección está en `obfuscator.js`. Si querés cambiar la ofuscación, editá ese archivo.

```bash
# Estructura de obfuscator.js
obfuscate(sourceCode)        # función principal
  ├── detectAndApplyMappings()  # renombra cosas de Roblox
  ├── generateJunk()            # código basura
  ├── build30xVM()              # 30 capas de VM
  ├── getExtraProtections()     # anti-debug, anti-tamper
  └── ...
```

## Deploy en Render (recomendado)

Render es más simple que Railway porque permite un archivo `render.yaml` que crea automáticamente los dos servicios.

### Pasos:

1. Creá cuenta en [render.com](https://render.com).
2. En el dashboard, clic en **New** → **Blueprint**.
3. Conectá tu cuenta de GitHub o subí el código manualmente.
4. Si subís manualmente:
   - New → **Web Service**.
   - Subí el zip `banana-render-ready.zip`.
   - Elegí el servicio como **Node**.
   - Render detecta el `package.json` y corre `npm run start:api`.
5. Para el bot, creá un segundo servicio tipo **Background Worker**:
   - Subí el mismo zip.
   - Start command: `npm run start:bot`.

### Variables en Render

**Servicio API (`banana-api`):**

```
BOT_API_KEY=una_clave_larga_aleatoria
API_BASE_URL=https://tu-api-url.onrender.com
```

**Servicio Bot (`banana-bot`):**

```
DISCORD_TOKEN=tu_token
DISCORD_CLIENT_ID=tu_client_id
BOT_API_KEY=la_misma_clave_de_arriba
API_URL=https://tu-api-url.onrender.com
ALLOWED_GUILD_IDS=123456789012345678
ALLOWED_USER_IDS=123456789012345678
```

> **Nota:** `API_BASE_URL` en la API y `API_URL` en el bot deben ser la URL pública que te da Render.

### Registrar comandos slash en Render

Una vez que el bot está deployado, entrá a la consola del servicio `banana-bot` y ejecutá:

```bash
npm run deploy
```

Solo hace falta una vez.

## Deploy en Railway

1. Andá a [railway.app](https://railway.app).
2. Creá proyecto nuevo.
3. Subí el zip.
4. Railway corre la API con `npm start`.
5. Copiá la URL pública de la API.
6. Agregá las variables en la pestaña **Variables** del servicio de la API:
   ```
   BOT_API_KEY=una_clave_larga_aleatoria
   API_BASE_URL=https://api-production-abc.up.railway.app
   ```
7. Creá un segundo servicio vacío para el bot:
   - Start command: `npm run start:bot`.
   - Variables:
     ```
     DISCORD_TOKEN=tu_token
     DISCORD_CLIENT_ID=tu_client_id
     BOT_API_KEY=la_misma_clave
     API_URL=https://api-production-abc.up.railway.app
     ALLOWED_GUILD_IDS=123456789012345678
     ALLOWED_USER_IDS=123456789012345678
     ```
8. Ejecutá `npm run deploy` en la consola del bot una vez.

## Deploy en VPS

```bash
git clone https://github.com/tuusuario/banana-protector.git
cd banana-protector/banana-standalone
npm install
cp .env.example .env
# Editá .env
npm run start:api
```

Usá `pm2` o `systemd` para mantenerlos corriendo.

## Subir a GitHub

Desde el código en Replit:

```bash
git add -A
git commit -m "Banana Protector standalone"
git push origin main
```

Si el push falla por autenticación, reconectá GitHub en Replit: **Git panel → Reconnect GitHub**.

## Dominio personalizado

Para usar `api.tudominio.com`:

1. Hosteá la API en Render/Railway/VPS.
2. Configurá el dominio en la plataforma que uses.
3. Apuntá el dominio a la IP/URL que te dan.
4. Seteá `API_BASE_URL=https://api.tudominio.com` en la API.
5. Seteá `API_URL=https://api.tudominio.com` en el bot.

## Qué pasa si algo falla

- **Bot no responde:** revisá `DISCORD_TOKEN` y `DISCORD_CLIENT_ID`.
- **Bot dice "API error 404/403":** revisá `API_URL` y `BOT_API_KEY` (deben ser iguales en API y bot).
- **URLs no cargan:** revisá `API_BASE_URL` en la API. Tiene que ser la URL pública.
- **Scripts desaparecen:** si usás la versión portable, se guardan en `data/scripts.json`. En Render/Railway, el disco se reinicia si no usás persistent storage. Para producción, migrá a una base de datos real.