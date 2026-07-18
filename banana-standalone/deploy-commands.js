const { SlashCommandBuilder, REST, Routes } = require("discord.js");
require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID");
  process.exit(1);
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

const rest = new REST({ version: "10" }).setToken(TOKEN);
rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) })
  .then(() => console.log("Slash commands registered globally."))
  .catch(console.error);