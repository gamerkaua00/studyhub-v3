// StudyHub v3 — slashCommands/info-servidor.js (admin)
const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("info-servidor").setDescription("Informações do servidor (Admin)"),
  async execute(interaction) {
    const guild   = interaction.guild;
    const members = await guild.members.fetch();
    const roles   = await guild.roles.fetch();
    const channels = guild.channels.cache;

    const estudantes = members.filter((m) => m.roles.cache.some((r) => r.name === "Estudante")).size;
    const admins     = members.filter((m) => m.roles.cache.some((r) => r.name === "Admin")).size;
    const tcc        = members.filter((m) => m.roles.cache.some((r) => r.name === "TCC")).size;
    const bots       = members.filter((m) => m.user.bot).size;

    interaction.reply({ embeds: [{ title: `📊 ${guild.name}`, color: 0x5865F2,
      fields: [
        { name: "👥 Membros",     value: String(guild.memberCount),       inline: true },
        { name: "🎓 Estudantes",  value: String(estudantes),              inline: true },
        { name: "🛡️ Admins",      value: String(admins),                  inline: true },
        { name: "📝 TCC",         value: String(tcc),                     inline: true },
        { name: "🤖 Bots",        value: String(bots),                    inline: true },
        { name: "📺 Canais",      value: String(channels.filter((c) => c.type === 0).size), inline: true },
      ],
      thumbnail: { url: guild.iconURL() || "" },
      timestamp: new Date().toISOString(), footer: { text: "StudyHub v3" } }] });
  },
};
