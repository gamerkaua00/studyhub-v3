// StudyHub v3 — events/guildMemberRemove.js
const { logInfo } = require("../services/logService");

module.exports = {
  name: "guildMemberRemove",
  once: false,
  async execute(member, client) {
    await logInfo(client, `👋 **${member.user.tag}** saiu do servidor.`);
  },
};
