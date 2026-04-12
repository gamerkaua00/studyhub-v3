// StudyHub v3.1.2 — /faltas (admin)
const { SlashCommandBuilder } = require("discord.js");
const { apiGet } = require("../utils/api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("faltas")
    .setDescription("Gerencia faltas dos alunos (Admin)")
    .addSubcommand((sub) => sub.setName("ver").setDescription("Ver resumo de faltas")
      .addStringOption((o) => o.setName("aluno").setDescription("Nome do aluno").setRequired(false))
      .addStringOption((o) => o.setName("materia").setDescription("Matéria").setRequired(false)))
    .addSubcommand((sub) => sub.setName("alertas").setDescription("Ver alunos próximos do limite (15+ faltas)")),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    try {
      if (sub === "ver") {
        const aluno   = interaction.options.getString("aluno") || "";
        const materia = interaction.options.getString("materia") || "";
        const params  = new URLSearchParams();
        if (aluno)   params.append("student", aluno);
        if (materia) params.append("subject", materia);
        const res = await apiGet(`/api/faults/summary?${params}`);
        const data = res.data || [];

        if (!data.length) return interaction.editReply("✅ Nenhuma falta registrada.");

        const fields = data.slice(0, 20).map((d) => ({
          name: `${d.atLimit ? "🔴" : d.pct >= 75 ? "🟠" : "🟢"} ${d.student} — ${d.subject}`,
          value: `**${d.unexcused}** faltas injustificadas (${d.pct}% do limite)\nJustificadas: ${d.justified}`,
          inline: true,
        }));

        interaction.editReply({ embeds: [{ author: { name: "📊 Controle de Faltas" }, title: "Resumo", color: 0xED4245, fields, timestamp: new Date().toISOString(), footer: { text: "StudyHub IFPR • Limite: 20 faltas" } }] });

      } else if (sub === "alertas") {
        const res  = await apiGet("/api/faults/summary");
        const data = (res.data || []).filter((d) => d.unexcused >= 15);

        if (!data.length) return interaction.editReply("✅ Nenhum aluno em situação crítica.");

        const fields = data.map((d) => ({
          name: `${d.unexcused >= 20 ? "🔴" : "🟠"} ${d.student}`,
          value: `**${d.subject}**: ${d.unexcused}/${20} faltas`,
          inline: true,
        }));

        interaction.editReply({ embeds: [{ author: { name: "🚨 Alertas de Faltas" }, title: `${data.length} aluno(s) em situação crítica`, color: 0xED4245, fields, timestamp: new Date().toISOString(), footer: { text: "StudyHub IFPR • Limite: 20 faltas" } }] });
      }
    } catch (err) {
      interaction.editReply(`❌ Erro: ${err.message}`);
    }
  },
};
