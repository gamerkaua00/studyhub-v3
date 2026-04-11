// StudyHub v3 — slashCommands/reenviar-agenda.js (admin)
const { SlashCommandBuilder } = require("discord.js");
const { apiGet, formatDate, typeEmoji } = require("../utils/api");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("reenviar-agenda")
    .setDescription("Reenvia a agenda do mês no #agenda (Admin)"),
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const now   = new Date();
      const month = now.getMonth() + 1;
      const year  = now.getFullYear();
      const res   = await apiGet(`/api/public/agenda?month=${month}&year=${year}`);
      if (!res.success || !res.data?.length) return interaction.editReply("✅ Nenhum conteúdo este mês para reenviar.");

      const agenda = interaction.guild.channels.cache.find((c) => c.name === "agenda");
      if (!agenda) return interaction.editReply("❌ Canal #agenda não encontrado.");

      const byDate = {};
      for (const c of res.data) { if (!byDate[c.date]) byDate[c.date] = []; byDate[c.date].push(c); }
      const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
      const fields = Object.entries(byDate).slice(0, 25).map(([date, items]) => {
        const [y,m,d] = date.split("-");
        return { name: `📅 ${d}/${m}`, value: items.map((c) => `${typeEmoji(c.type)} **${c.time}** — ${c.title} *(${c.subject})*`).join("\n"), inline: false };
      });

      await agenda.send({ embeds: [{ title: `📅 Agenda — ${months[month-1]} ${year}`, color: 0x5865F2, fields, timestamp: new Date().toISOString(), footer: { text: `StudyHub • ${res.data.length} item(ns) • Reenviado por ${interaction.user.username}` } }] });
      interaction.editReply(`✅ Agenda reenviada em <#${agenda.id}> com ${res.data.length} item(ns).`);
    } catch (err) {
      interaction.editReply(`❌ Erro: ${err.message}`);
    }
  },
};
