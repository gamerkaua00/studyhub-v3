const { apiGet, formatDate, daysUntil } = require("../utils/api");
module.exports = {
  name: "provas",
  async execute(message) {
    await message.channel.sendTyping();
    try {
      const res = await apiGet("/api/public/exams");
      if (!res.success || !res.data?.length) {
        return message.reply({ embeds: [{ title: "📝 Provas", description: "✅ Nenhuma prova agendada.", color: 0x57F287 }] });
      }
      const fields = res.data.map((exam) => {
        const days = daysUntil(exam.date);
        const countdown = days === 0 ? "🔴 **HOJE!**" : days === 1 ? "🟠 **Amanhã!**" : days <= 3 ? `🟡 Em **${days} dias**` : `🟢 Em **${days} dias**`;
        return { name: `📝 ${exam.title}`, value: `📌 ${exam.subject}\n🕐 ${formatDate(exam.date)} às ${exam.time}\n${countdown}`, inline: true };
      });
      const urgent = res.data.filter((e) => daysUntil(e.date) <= 1).length;
      message.reply({ embeds: [{ title: "📝 Provas Futuras", description: urgent > 0 ? `⚠️ **${urgent} prova(s) muito próxima(s)!**` : `${res.data.length} prova(s) agendada(s).`, color: urgent > 0 ? 0xED4245 : 0xFEE75C, fields, timestamp: new Date().toISOString() }] });
    } catch { message.reply("❌ Erro ao buscar provas."); }
  },
};
