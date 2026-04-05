const { SlashCommandBuilder } = require("discord.js");
const { apiGet, formatDate, daysUntil } = require("../utils/api");
module.exports = {
  data: new SlashCommandBuilder().setName("provas").setDescription("Lista provas futuras com contagem regressiva"),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await apiGet("/api/public/exams");
      if (!res.success || !res.data?.length) return interaction.editReply({ embeds: [{ title: "📝 Provas", description: "✅ Nenhuma prova.", color: 0x57F287 }] });
      const fields = res.data.map((exam) => {
        const days = daysUntil(exam.date);
        const cd   = days === 0 ? "🔴 **HOJE!**" : days === 1 ? "🟠 **Amanhã!**" : days <= 3 ? `🟡 Em **${days} dias**` : `🟢 Em **${days} dias**`;
        return { name: `📝 ${exam.title}`, value: `📌 ${exam.subject}\n🕐 ${formatDate(exam.date)} às ${exam.time}\n${cd}`, inline: true };
      });
      const urgent = res.data.filter((e) => daysUntil(e.date) <= 1).length;
      interaction.editReply({ embeds: [{ title: "📝 Provas Futuras", description: urgent > 0 ? `⚠️ **${urgent} prova(s) próxima(s)!**` : `${res.data.length} prova(s).`, color: urgent > 0 ? 0xED4245 : 0xFEE75C, fields, timestamp: new Date().toISOString() }] });
    } catch { interaction.editReply("❌ Erro ao buscar provas."); }
  },
};
