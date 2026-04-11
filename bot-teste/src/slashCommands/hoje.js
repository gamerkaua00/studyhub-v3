const { SlashCommandBuilder } = require("discord.js");
const { apiGet, formatDate, typeEmoji } = require("../utils/api");
module.exports = {
  data: new SlashCommandBuilder().setName("hoje").setDescription("Mostra os conteúdos de hoje"),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await apiGet("/api/public/today");
      if (!res.success || !res.data.length) {
        return interaction.editReply({ embeds: [{ title: "📅 Hoje", description: "✅ Nenhum conteúdo hoje!", color: 0x57F287 }] });
      }
      const bySubject = {};
      for (const c of res.data) { if (!bySubject[c.subject]) bySubject[c.subject] = []; bySubject[c.subject].push(c); }
      const fields = Object.entries(bySubject).map(([s, items]) => ({
        name: `📌 ${s}`,
        value: items.map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title}`).join("\n"),
        inline: false,
      }));
      interaction.editReply({ embeds: [{ title: `📅 Hoje — ${formatDate(res.date)}`, color: 0x5865F2, fields, timestamp: new Date().toISOString() }] });
    } catch { interaction.editReply("❌ Erro ao buscar dados."); }
  },
};
