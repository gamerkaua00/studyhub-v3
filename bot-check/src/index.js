// ============================================================
// StudyHub v2 — bot/src/index.js
// ============================================================

require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const path = require("path");
const fs   = require("fs");
const { setupServer } = require("./services/setupServer");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,      // Para detectar novos membros
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,    // Para enviar DM de cargo
  ],
});

// Carrega comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js")).forEach((file) => {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.name, cmd);
  console.log(`[Bot] Comando: ${cmd.name}`);
});

// Carrega eventos
const eventsPath = path.join(__dirname, "events");
fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js")).forEach((file) => {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error("❌ Login falhou:", err.message);
  process.exit(1);
});
