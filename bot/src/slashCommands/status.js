const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("status").setDescription("Mostra o status e uptime do bot"),
  async execute(interaction, client) {
    const uptime  = Math.floor((Date.now() - client.startTime) / 1000);
    const hours   = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    interaction.reply({ embeds: [{ title: "📊 Status do StudyHub Bot", color: 0x57F287,
      fields: [
        { name: "🟢 Status",   value: "Online",                                inline: true },
        { name: "⏱️ Uptime",   value: `${hours}h ${minutes}m ${seconds}s`,    inline: true },
        { name: "📡 Servidores", value: String(client.guilds.cache.size),      inline: true },
        { name: "🤖 Versão",   value: "StudyHub v3.0",                         inline: true },
      ],
      timestamp: new Date().toISOString(), footer: { text: "StudyHub v3" } }] });
  },
};
