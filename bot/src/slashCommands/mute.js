const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("mute").setDescription("Silencia um membro (Admin)")
    .addUserOption((o) => o.setName("usuario").setDescription("Membro a silenciar").setRequired(true))
    .addIntegerOption((o) => o.setName("minutos").setDescription("Duração em minutos (padrão: 10)").setMinValue(1).setMaxValue(1440)),
  async execute(interaction) {
    const user    = interaction.options.getMember("usuario");
    const minutes = interaction.options.getInteger("minutos") || 10;
    try {
      await user.timeout(minutes * 60 * 1000, `Silenciado por ${interaction.user.tag}`);
      interaction.reply({ embeds: [{ title: "🔇 Membro Silenciado", description: `<@${user.id}> foi silenciado por **${minutes} minuto(s)**.`, color: 0xED4245, timestamp: new Date().toISOString() }] });
    } catch (err) {
      interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true });
    }
  },
};
