// ============================================================
// StudyHub — commands/hoje.js
// !hoje → lista os conteúdos agendados para hoje
// ============================================================

const { apiGet, formatDate, typeEmoji, hexToDecimal } = require("../utils/api");

module.exports = {
  name: "hoje",
  description: "Mostra os conteúdos agendados para hoje",

  async execute(message) {
    try {
      // Indicador de digitando...
      await message.channel.sendTyping();

      const response = await apiGet("/api/contents/today");

      if (!response.success || response.data.length === 0) {
        return message.reply({
          embeds: [{
            title: "📅 Agenda de Hoje",
            description: "✅ Nenhum conteúdo agendado para hoje. Dia livre!",
            color: 0x57F287,
            footer: { text: `StudyHub • ${formatDate(response.date || "")}` },
            timestamp: new Date().toISOString(),
          }],
        });
      }

      const contents = response.data;

      // Agrupa por matéria para apresentação mais limpa
      const bySubject = {};
      for (const c of contents) {
        if (!bySubject[c.subject]) bySubject[c.subject] = [];
        bySubject[c.subject].push(c);
      }

      const fields = [];
      for (const [subject, items] of Object.entries(bySubject)) {
        const lines = items
          .map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title} *(${c.type})*`)
          .join("\n");
        fields.push({ name: `📌 ${subject}`, value: lines, inline: false });
      }

      await message.reply({
        embeds: [{
          title: `📅 Agenda de Hoje — ${formatDate(response.date)}`,
          color: 0x5865F2,
          fields,
          footer: { text: `StudyHub • ${contents.length} item(ns) hoje` },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      console.error("[!hoje] Erro:", err.message);
      message.reply("❌ Não foi possível buscar os conteúdos de hoje. Verifique se o backend está online.");
    }
  },
};
