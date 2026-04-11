// StudyHub v3 — slashCommands/unmute.js (admin)
const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("unmute").setDescription("Remove silenciamento de um membro (Admin)")
    .addUserOption((o) => o.setName("usuario").setDescription("Membro").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getMember("usuario");
    try {
      await user.timeout(null);
      interaction.reply({ embeds: [{ title: "🔊 Silenciamento Removido", description: `<@${user.id}> não está mais silenciado.`, color: 0x57F287, timestamp: new Date().toISOString() }] });
    } catch (err) { interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true }); }
  },
};
