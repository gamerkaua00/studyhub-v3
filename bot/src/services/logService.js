// StudyHub v3 — services/logService.js
const { ChannelType } = require("discord.js");

const logError = async (client, title, description, critical = false) => {
  try {
    for (const [, guild] of client.guilds.cache) {
      const channels = await guild.channels.fetch();
      const logChannel = channels.find((c) => c.name === "log-bot" && c.type === ChannelType.GuildText);
      if (!logChannel) continue;

      await logChannel.send({
        embeds: [{
          title: `${critical ? "🚨" : "⚠️"} ${title}`,
          description,
          color: critical ? 0xED4245 : 0xFEE75C,
          timestamp: new Date().toISOString(),
          footer: { text: "StudyHub • Log de Sistema" },
        }],
      });

      // DM para admins se crítico
      if (critical) {
        const roles = await guild.roles.fetch();
        const adminRole = roles.find((r) => r.name === "Admin");
        if (!adminRole) continue;

        const members = await guild.members.fetch();
        const admins  = members.filter((m) => m.roles.cache.has(adminRole.id));

        for (const [, admin] of admins) {
          try {
            await admin.send(`🚨 **Erro crítico no StudyHub!**\n**${title}**\n${description}`);
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error("[LogService] Erro ao logar:", err.message);
  }
};

const logInfo = async (client, message) => {
  try {
    for (const [, guild] of client.guilds.cache) {
      const channels   = await guild.channels.fetch();
      const logChannel = channels.find((c) => c.name === "log-bot" && c.type === ChannelType.GuildText);
      if (logChannel) {
        await logChannel.send({ content: `ℹ️ ${message}` });
      }
    }
  } catch {}
};

module.exports = { logError, logInfo };
