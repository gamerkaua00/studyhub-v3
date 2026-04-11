const { apiGet, formatDate, typeEmoji } = require("../utils/api");
module.exports = {
  name: "agenda",
  async execute(message, args) {
    await message.channel.sendTyping();
    try {
      const limit = Math.min(parseInt(args[0]) || 7, 20);
      const res   = await apiGet(`/api/public/agenda?limit=${limit}`);
      if (!res.success || !res.data?.length) {
        return message.reply({ embeds: [{ title: "📆 Agenda", description: "✅ Nenhum conteúdo agendado.", color: 0x57F287 }] });
      }
      const byDate = {};
      for (const c of res.data) { if (!byDate[c.date]) byDate[c.date] = []; byDate[c.date].push(c); }
      const fields = Object.entries(byDate).slice(0, 10).map(([date, items]) => ({
        name: `📅 ${formatDate(date)}`,
        value: items.map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title} | ${c.subject}`).join("\n"),
        inline: false,
      }));
      message.reply({ embeds: [{ title: `📆 Próximos ${res.data.length} Conteúdo(s)`, color: 0x1ABC9C, fields, timestamp: new Date().toISOString(), footer: { text: "StudyHub • !agenda [número]" } }] });
    } catch { message.reply("❌ Erro ao buscar agenda."); }
  },
};
