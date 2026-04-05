// ============================================================
// StudyHub — commands/agenda.js
// !agenda → próximos conteúdos agendados
// ============================================================

const { apiGet, formatDate, typeEmoji, hexToDecimal } = require("../utils/api");

module.exports = {
  name: "agenda",
  description: "Mostra os próximos conteúdos agendados",

  async execute(message, args) {
    try {
      await message.channel.sendTyping();

      // Permite !agenda 5 para customizar o limite
      const limit = parseInt(args[0]) || 7;
      const response = await apiGet(`/api/contents/upcoming?limit=${Math.min(limit, 20)}`);

      if (!response.success || response.data.length === 0) {
        return message.reply({
          embeds: [{
            title: "📆 Próximos Conteúdos",
            description: "✅ Nenhum conteúdo agendado para os próximos dias.",
            color: 0x57F287,
            timestamp: new Date().toISOString(),
            footer: { text: "StudyHub • Agenda" },
          }],
        });
      }

      const contents = response.data;

      // Agrupa por data
      const byDate = {};
      for (const c of contents) {
        if (!byDate[c.date]) byDate[c.date] = [];
        byDate[c.date].push(c);
      }

      const fields = [];
      for (const [date, items] of Object.entries(byDate)) {
        const lines = items
          .map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title} | ${c.subject}`)
          .join("\n");
        fields.push({ name: `📅 ${formatDate(date)}`, value: lines, inline: false });

        // Discord limita a 25 fields por embed
        if (fields.length >= 10) break;
      }

      await message.reply({
        embeds: [{
          title: `📆 Próximos ${contents.length} Conteúdo(s)`,
          color: 0x1ABC9C,
          fields,
          footer: { text: "StudyHub • Use !agenda <número> para ver mais" },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      console.error("[!agenda] Erro:", err.message);
      message.reply("❌ Não foi possível buscar a agenda. Verifique se o backend está online.");
    }
  },
};
