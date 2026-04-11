const { SlashCommandBuilder } = require("discord.js");
const { apiGet, formatDate, typeEmoji } = require("../utils/api");
module.exports = {
  data: new SlashCommandBuilder().setName("agenda").setDescription("Próximos conteúdos agendados")
    .addIntegerOption((o) => o.setName("numero").setDescription("Quantidade de itens (padrão: 7)").setMinValue(1).setMaxValue(20)),
  async execute(interaction) {
    await interaction.deferReply();
    const limit = interaction.options.getInteger("numero") || 7;
    try {
      const res = await apiGet(`/api/public/agenda?limit=${limit}`);
      if (!res.success || !res.data?.length) return interaction.editReply({ embeds: [{ title: "📆 Agenda", description: "✅ Nenhum conteúdo.", color: 0x57F287 }] });
      const byDate = {};
      for (const c of res.data) { if (!byDate[c.date]) byDate[c.date] = []; byDate[c.date].push(c); }
      const fields = Object.entries(byDate).slice(0, 10).map(([date, items]) => ({
        name: `📅 ${formatDate(date)}`,
        value: items.map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title}`).join("\n"),
        inline: false,
      }));
      interaction.editReply({ embeds: [{ title: `📆 Próximos ${res.data.length} Conteúdo(s)`, color: 0x1ABC9C, fields, timestamp: new Date().toISOString() }] });
    } catch { interaction.editReply("❌ Erro ao buscar agenda."); }
  },
};
