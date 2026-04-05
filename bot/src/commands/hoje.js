const { apiGet, formatDate, typeEmoji } = require("../utils/api");
module.exports = {
  name: "hoje",
  async execute(message) {
    await message.channel.sendTyping();
    try {
      const res = await apiGet("/api/public/today");
      if (!res.success || !res.data.length) {
        return message.reply({ embeds: [{ title: "📅 Hoje", description: "✅ Nenhum conteúdo hoje!", color: 0x57F287, timestamp: new Date().toISOString() }] });
      }
      const bySubject = {};
      for (const c of res.data) { if (!bySubject[c.subject]) bySubject[c.subject] = []; bySubject[c.subject].push(c); }
      const fields = Object.entries(bySubject).map(([s, items]) => ({
        name: `📌 ${s}`,
        value: items.map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title}`).join("\n"),
        inline: false,
      }));
      message.reply({ embeds: [{ title: `📅 Agenda de Hoje — ${formatDate(res.date)}`, color: 0x5865F2, fields, timestamp: new Date().toISOString(), footer: { text: `StudyHub • ${res.data.length} item(ns)` } }] });
    } catch (err) { message.reply("❌ Erro ao buscar dados. Backend pode estar acordando, tente novamente."); }
  },
};
