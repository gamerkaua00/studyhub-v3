// StudyHub v3 — bot/src/index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const path = require("path");
const fs   = require("fs");
const { setupServer } = require("./services/setupServer");
const { logError }    = require("./services/logService");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands     = new Collection();
client.slashCommands = new Collection();
client.startTime    = Date.now();

// Carrega comandos de prefixo (!)
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js")).forEach((file) => {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.name) {
    client.commands.set(cmd.name, cmd);
    console.log(`[Bot] Comando: !${cmd.name}`);
  }
});

// Carrega slash commands (/)
const slashPath = path.join(__dirname, "slashCommands");
if (fs.existsSync(slashPath)) {
  fs.readdirSync(slashPath).filter((f) => f.endsWith(".js")).forEach((file) => {
    const cmd = require(path.join(slashPath, file));
    if (cmd.data) {
      client.slashCommands.set(cmd.data.name, cmd);
      console.log(`[Bot] Slash: /${cmd.data.name}`);
    }
  });
}

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

// Registra slash commands na API do Discord
const registerSlashCommands = async () => {
  const commands = [];
  client.slashCommands.forEach((cmd) => commands.push(cmd.data.toJSON()));

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.DISCORD_GUILD_ID),
      { body: commands }
    );
    console.log(`[Bot] ${commands.length} slash commands registrados`);
  } catch (err) {
    console.error("[Bot] Erro ao registrar slash commands:", err.message);
  }
};

client.once("clientReady", async (c) => {
  console.log(`\n✅ Bot online: ${c.user.tag}`);
  console.log(`📡 ${c.guilds.cache.size} servidor(es)\n`);

  c.user.setPresence({
    activities: [{ name: "📚 StudyHub | /ajuda" }],
    status: "online",
  });

  // Registra slash commands após estar online
  await registerSlashCommands();

  for (const [, guild] of c.guilds.cache) {
    await setupServer(guild, c);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(async (err) => {
  console.error("❌ Login falhou:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error("[Bot] UnhandledRejection:", reason);
  await logError(client, "Erro não tratado (bot)", String(reason), true);
});
