// ============================================================
// StudyHub v2 — events/ready.js
// ============================================================

const { setupServer } = require("../services/setupServer");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`\n✅ Bot online: ${client.user.tag}`);
    console.log(`📡 ${client.guilds.cache.size} servidor(es)\n`);

    client.user.setPresence({
      activities: [{ name: "📚 StudyHub | !ajuda" }],
      status: "online",
    });

    for (const [, guild] of client.guilds.cache) {
      await setupServer(guild);
    }
  },
};
