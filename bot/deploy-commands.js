// Run this once to register slash commands: node deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID");
  process.exit(1);
}

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

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands.map((c) => c.toJSON()),
    });
    console.log("Done! Commands registered globally.");
  } catch (err) {
    console.error(err);
  }
})();
