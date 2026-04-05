// StudyHub v3 — events/ready.js
const { setupServer } = require("../services/setupServer");
const { logInfo }     = require("../services/logService");

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`\n✅ Bot online: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: "📚 StudyHub | /ajuda" }], status: "online" });
    for (const [, guild] of client.guilds.cache) {
      await setupServer(guild, client);
    }
    await logInfo(client, `✅ Bot iniciado — ${client.user.tag}`);
  },
};
