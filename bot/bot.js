// Banana Bot — Discord bot for Banana API
// Commands: /api_url, /make_file, /help

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, REST, Routes } = require("discord.js");
const fetch = require("node-fetch");
const { obfuscate } = require("./obfuscator.js");
const { createWriteStream, mkdirSync, existsSync } = require("fs");
const path = require("path");
const os = require("os");

// ─── Config ────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_API_KEY = process.env.BOT_API_KEY;

// API server URL — the local proxy or an override
const API_BASE = process.env.API_BASE_URL || "http://localhost:80";

if (!TOKEN) throw new Error("Missing DISCORD_TOKEN environment variable");
if (!CLIENT_ID) throw new Error("Missing DISCORD_CLIENT_ID environment variable");
if (!BOT_API_KEY) throw new Error("Missing BOT_API_KEY environment variable");

// ─── Client ────────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Upload a script to the API and return the URL */
async function uploadScript(content, password) {
  const body = { content };
  if (password) body.password = password;

  const res = await fetch(`${API_BASE}/api/s`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bot-key": BOT_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.url;
}

/** Build the loadstring line */
function buildLoadstring(url) {
  return `loadstring(game:HttpGet("${url}",true))()`;
}

/** Download a Discord attachment and return its text content */
async function fetchAttachment(attachment) {
  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error("Could not download the attached file.");
  return await res.text();
}

// ─── Slash Commands Definition ─────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("api_url")
    .setDescription("Upload Lua code and get a loadstring URL")
    .addStringOption((opt) =>
      opt.setName("code").setDescription("Paste your Lua code here").setRequired(false)
    )
    .addAttachmentOption((opt) =>
      opt.setName("file").setDescription("Upload a .lua file instead of pasting code").setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt.setName("obfuscation").setDescription("Obfuscate the code with Banana Protector (default: false)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("password").setDescription("Protect the script with a password").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("make_file")
    .setDescription("Generate a .lua file from a loadstring or raw code")
    .addStringOption((opt) =>
      opt.setName("code").setDescription("Lua code or loadstring to put in the file").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("url").setDescription("If provided, wraps this URL in a loadstring automatically").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available bot commands and how to use them"),
];

// ─── Register Commands (called at startup) ─────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands.map((c) => c.toJSON()),
    });
    console.log("Slash commands registered globally.");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

// ─── Interaction Handler ───────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  // ── Button: copy loadstring ──
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("copy_")) {
      const loadstring = Buffer.from(interaction.customId.slice(5), "base64").toString("utf-8");
      await interaction.reply({
        content: `\`\`\`lua\n${loadstring}\n\`\`\``,
        ephemeral: true,
      });
    }
    return;
  }

  const { commandName } = interaction;

  // ════════════════════════════════════════════════════
  // /api_url
  // ════════════════════════════════════════════════════
  if (commandName === "api_url") {
    await interaction.deferReply();

    try {
      const codeOption = interaction.options.getString("code");
      const fileOption = interaction.options.getAttachment("file");
      const doObfuscate = interaction.options.getBoolean("obfuscation") ?? false;
      const password = interaction.options.getString("password") ?? undefined;

      // Validate: must provide code OR file
      if (!codeOption && !fileOption) {
        await interaction.editReply({
          content: "❌ You must provide either `code` or a `file` attachment.",
        });
        return;
      }

      let luaCode = codeOption ?? "";

      if (fileOption) {
        // Validate file type
        if (fileOption.name && !fileOption.name.endsWith(".lua") && !fileOption.name.endsWith(".txt")) {
          await interaction.editReply({ content: "❌ Only `.lua` or `.txt` files are supported." });
          return;
        }
        luaCode = await fetchAttachment(fileOption);
      }

      // Obfuscate if requested
      if (doObfuscate) {
        luaCode = obfuscate(luaCode);
      }

      // Upload to API
      const url = await uploadScript(luaCode, password);
      const loadstring = buildLoadstring(url);

      // Encode loadstring as base64 for button customId (max 100 chars)
      // If too long, skip button
      const encoded = Buffer.from(loadstring).toString("base64");
      const canHaveButton = ("copy_" + encoded).length <= 100;

      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle("🍌 Script Uploaded!")
        .setDescription(
          `Your script has been uploaded.\n\nCopy the loadstring below and paste it into your executor:\n\n\`\`\`lua\n${loadstring}\n\`\`\``
        )
        .addFields(
          { name: "🔗 URL", value: url, inline: false },
          { name: "🔒 Password Protected", value: password ? "Yes" : "No", inline: true },
          { name: "🛡️ Obfuscated", value: doObfuscate ? "Yes" : "No", inline: true }
        )
        .setFooter({ text: "Banana API • Protected by Banana Protector" })
        .setTimestamp();

      const components = [];
      if (canHaveButton) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`copy_${encoded}`)
            .setLabel("📋 Copy Loadstring")
            .setStyle(ButtonStyle.Primary)
        );
        components.push(row);
      }

      await interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      console.error("/api_url error:", err);
      await interaction.editReply({
        content: `❌ Something went wrong: ${err.message}`,
      });
    }
    return;
  }

  // ════════════════════════════════════════════════════
  // /make_file
  // ════════════════════════════════════════════════════
  if (commandName === "make_file") {
    await interaction.deferReply();

    try {
      let code = interaction.options.getString("code");
      const url = interaction.options.getString("url");

      // If a URL is provided, wrap it in a loadstring
      if (url) {
        code = buildLoadstring(url);
      }

      // Write to a temp .lua file
      const tmpDir = os.tmpdir();
      const fileName = `script_${Date.now()}.lua`;
      const filePath = path.join(tmpDir, fileName);
      require("fs").writeFileSync(filePath, code, "utf-8");

      const attachment = new AttachmentBuilder(filePath, { name: fileName });

      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle("🍌 Lua File Generated!")
        .setDescription("Here is your `.lua` file. Download it and run it in your executor.")
        .setFooter({ text: "Banana API • make_file" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      console.error("/make_file error:", err);
      await interaction.editReply({ content: `❌ Something went wrong: ${err.message}` });
    }
    return;
  }

  // ════════════════════════════════════════════════════
  // /help
  // ════════════════════════════════════════════════════
  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle("🍌 Banana Bot — Help")
      .setDescription("Here are all the available commands:")
      .addFields(
        {
          name: "📤 `/api_url`",
          value:
            "Upload Lua code and receive a `loadstring` URL ready to execute.\n\n" +
            "**Options:**\n" +
            "`code` — Paste your Lua code directly\n" +
            "`file` — Upload a `.lua` file instead\n" +
            "`obfuscation` — Set to `True` to protect the code with **Banana Protector**\n" +
            "`password` — Lock the script with a password (`?pw=yourpass` to access)\n\n" +
            "**Output example:**\n" +
            "```lua\nloadstring(game:HttpGet(\"https://example.com/api/s/abc123\",true))()\n```",
          inline: false,
        },
        {
          name: "📁 `/make_file`",
          value:
            "Generate a `.lua` file from code or a URL and download it.\n\n" +
            "**Options:**\n" +
            "`code` *(required)* — Lua code or a loadstring to put in the file\n" +
            "`url` — Provide a URL to auto-wrap it into a `loadstring(...)()`",
          inline: false,
        },
        {
          name: "❓ `/help`",
          value: "Shows this help message with all commands.",
          inline: false,
        }
      )
      .addFields({
        name: "🛡️ About Banana Protector",
        value:
          "Banana Protector obfuscates your Lua scripts using advanced techniques like " +
          "rolling XOR ciphers, control-flow flattening, junk code injection, and 18-layer VM wrapping. " +
          "Join our community: [discord.gg/P7n9kAmwv](https://discord.gg/P7n9kAmwv)",
        inline: false,
      })
      .setFooter({ text: "Banana API • discord.gg/P7n9kAmwv" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }
});

// ─── Ready ─────────────────────────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅ Banana Bot is online as ${client.user.tag}`);
  await registerCommands();
});

// ─── Start ─────────────────────────────────────────────────────────────────
client.login(TOKEN);
