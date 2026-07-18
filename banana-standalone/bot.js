// Banana Bot — Discord bot for Banana API
// Commands: /api_url, /make_file, /help

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, REST, Routes } = require("discord.js");
const { obfuscate } = require("./obfuscator.js");
const { writeFileSync } = require("fs");
const path = require("path");
const os = require("os");

const fetch = globalThis.fetch || (() => { throw new Error("fetch is not available; use Node 18+"); });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_API_KEY = process.env.BOT_API_KEY;
const API_URL = process.env.API_URL || "http://localhost:3000";

const ALLOWED_GUILD_IDS = (process.env.ALLOWED_GUILD_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
const ALLOWED_USER_IDS = (process.env.ALLOWED_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

if (!TOKEN) throw new Error("Missing DISCORD_TOKEN");
if (!CLIENT_ID) throw new Error("Missing DISCORD_CLIENT_ID");
if (!BOT_API_KEY) throw new Error("Missing BOT_API_KEY");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function uploadScript(content, password) {
  const body = { content };
  if (password) body.password = password;
  const res = await fetch(`${API_URL}/api/s`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bot-key": BOT_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return (await res.json()).url;
}

function buildLoadstring(url) {
  return `loadstring(game:HttpGet("${url}",true))()`;
}

async function fetchAttachment(attachment) {
  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error("Could not download the attached file.");
  return await res.text();
}

const commands = [
  new SlashCommandBuilder().setName("api_url").setDescription("Upload Lua code and get a loadstring URL")
    .addStringOption(o => o.setName("code").setDescription("Paste your Lua code here").setRequired(false))
    .addAttachmentOption(o => o.setName("file").setDescription("Upload a .lua file instead of pasting code").setRequired(false))
    .addBooleanOption(o => o.setName("obfuscation").setDescription("Obfuscate the code with Banana Protector").setRequired(false))
    .addStringOption(o => o.setName("password").setDescription("Protect the script with a password").setRequired(false)),
  new SlashCommandBuilder().setName("make_file").setDescription("Generate a .lua file from a loadstring or raw code")
    .addStringOption(o => o.setName("code").setDescription("Lua code or loadstring to put in the file").setRequired(true))
    .addStringOption(o => o.setName("url").setDescription("If provided, wraps this URL in a loadstring automatically").setRequired(false)),
  new SlashCommandBuilder().setName("help").setDescription("Show all available bot commands and how to use them"),
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log("Slash commands registered globally.");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

function isAllowed(interaction) {
  if (ALLOWED_GUILD_IDS.length === 0 && ALLOWED_USER_IDS.length === 0) return true;
  const guildOk = ALLOWED_GUILD_IDS.length === 0 || (interaction.guildId && ALLOWED_GUILD_IDS.includes(interaction.guildId));
  const userOk = ALLOWED_USER_IDS.length === 0 || (interaction.user && ALLOWED_USER_IDS.includes(interaction.user.id));
  return guildOk && userOk;
}

client.on("error", (err) => console.error("Discord client error:", err));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (!isAllowed(interaction)) {
    if (interaction.isRepliable()) await interaction.reply({ content: "❌ You are not authorized to use this bot.", ephemeral: true }).catch(() => {});
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("copy_")) {
      const loadstring = Buffer.from(interaction.customId.slice(5), "base64").toString("utf-8");
      await interaction.reply({ content: `\`\`\`lua\n${loadstring}\n\`\`\``, ephemeral: true });
    }
    return;
  }

  const { commandName } = interaction;

  if (commandName === "api_url") {
    try { await interaction.deferReply(); } catch { return; }
    try {
      const codeOption = interaction.options.getString("code");
      const fileOption = interaction.options.getAttachment("file");
      const doObfuscate = interaction.options.getBoolean("obfuscation") ?? false;
      const password = interaction.options.getString("password") ?? undefined;

      if (!codeOption && !fileOption) {
        await interaction.editReply({ content: "❌ You must provide either `code` or a `file` attachment." });
        return;
      }

      let luaCode = codeOption ?? "";
      if (fileOption) {
        if (fileOption.name && !fileOption.name.endsWith(".lua") && !fileOption.name.endsWith(".txt")) {
          await interaction.editReply({ content: "❌ Only `.lua` or `.txt` files are supported." });
          return;
        }
        luaCode = await fetchAttachment(fileOption);
      }
      if (doObfuscate) luaCode = obfuscate(luaCode);

      const url = await uploadScript(luaCode, password);
      const loadstring = buildLoadstring(url);
      const encoded = Buffer.from(loadstring).toString("base64");
      const canHaveButton = ("copy_" + encoded).length <= 100;

      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle("🍌 Script Uploaded!")
        .setDescription(`Your script has been uploaded.\n\nCopy the loadstring below:\n\n\`\`\`lua\n${loadstring}\n\`\`\``)
        .addFields(
          { name: "🔗 URL", value: url, inline: false },
          { name: "🔒 Password Protected", value: password ? "Yes" : "No", inline: true },
          { name: "🛡️ Obfuscated", value: doObfuscate ? "Yes" : "No", inline: true }
        )
        .setFooter({ text: "Banana API • Protected by Banana Protector" })
        .setTimestamp();

      const components = [];
      if (canHaveButton) {
        components.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`copy_${encoded}`).setLabel("📋 Copy Loadstring").setStyle(ButtonStyle.Primary)
        ));
      }
      await interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      console.error("/api_url error:", err);
      await interaction.editReply({ content: `❌ Something went wrong: ${err.message}` });
    }
    return;
  }

  if (commandName === "make_file") {
    try { await interaction.deferReply(); } catch { return; }
    try {
      let code = interaction.options.getString("code");
      const url = interaction.options.getString("url");
      if (url) code = buildLoadstring(url);
      const fileName = `script_${Date.now()}.lua`;
      const filePath = path.join(os.tmpdir(), fileName);
      writeFileSync(filePath, code, "utf-8");
      const attachment = new AttachmentBuilder(filePath, { name: fileName });
      const embed = new EmbedBuilder().setColor(0xf5c518).setTitle("🍌 Lua File Generated!").setDescription("Here is your `.lua` file.").setFooter({ text: "Banana API • make_file" }).setTimestamp();
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      console.error("/make_file error:", err);
      await interaction.editReply({ content: `❌ Something went wrong: ${err.message}` });
    }
    return;
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle("🍌 Banana Bot — Help")
      .setDescription("Available commands:")
      .addFields(
        { name: "📤 `/api_url`", value: "Upload Lua code and receive a `loadstring` URL.\nOptions: `code`, `file`, `obfuscation`, `password`", inline: false },
        { name: "📁 `/make_file`", value: "Generate a `.lua` file from code or a URL.\nOptions: `code`, `url`", inline: false },
        { name: "❓ `/help`", value: "Shows this help message.", inline: false }
      )
      .setFooter({ text: "Banana API" })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
});

client.once("ready", async () => {
  console.log(`✅ Banana Bot is online as ${client.user.tag}`);
  await registerCommands();
});

client.login(TOKEN);