// ============================================================
// StudyHub — commands/provas.js
// !provas → lista provas futuras com contagem regressiva
// ============================================================

const { apiGet, formatDate, hexToDecimal } = require("../utils/api");

/**
 * Calcula quantos dias faltam para uma data no formato "YYYY-MM-DD"
 */
const daysUntil = (dateStr) => {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const today = brt.toISOString().split("T")[0];

  const todayMs = new Date(today + "T00:00:00Z").getTime();
  const targetMs = new Date(dateStr + "T00:00:00Z").getTime();
  const diff = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
  return diff;
};

module.exports = {
  name: "provas",
  description: "Lista as provas futuras com contagem regressiva",

  async execute(message) {
    try {
      await message.channel.sendTyping();

      const response = await apiGet("/api/contents/exams");

      if (!response.success || response.data.length === 0) {
        return message.reply({
          embeds: [{
            title: "📝 Provas Futuras",
            description: "✅ Nenhuma prova agendada. Aproveite!",
            color: 0x57F287,
            timestamp: new Date().toISOString(),
            footer: { text: "StudyHub • Provas" },
          }],
        });
      }

      const exams = response.data;

      const fields = exams.map((exam) => {
        const days = daysUntil(exam.date);
        let countdown;
        if (days === 0) countdown = "🔴 **HOJE!**";
        else if (days === 1) countdown = "🟠 **Amanhã!**";
        else if (days <= 3) countdown = `🟡 Em **${days} dias**`;
        else countdown = `🟢 Em **${days} dias**`;

        return {
          name: `📝 ${exam.title}`,
          value: `📌 ${exam.subject}\n🕐 ${formatDate(exam.date)} às ${exam.time}\n${countdown}`,
          inline: true,
        };
      });

      // Alerta especial se houver prova hoje ou amanhã
      const urgent = exams.filter((e) => daysUntil(e.date) <= 1);
      const description = urgent.length > 0
        ? `⚠️ **Atenção! ${urgent.length} prova(s) muito próxima(s)!**`
        : `Você tem **${exams.length}** prova(s) agendada(s).`;

      await message.reply({
        embeds: [{
          title: "📝 Provas Futuras",
          description,
          color: urgent.length > 0 ? 0xED4245 : 0xFEE75C,
          fields,
          footer: { text: "StudyHub • As cores indicam urgência" },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      console.error("[!provas] Erro:", err.message);
      message.reply("❌ Não foi possível buscar as provas. Verifique se o backend está online.");
    }
  },
};
