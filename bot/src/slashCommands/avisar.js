const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("avisar")
    .setDescription("[Admin] Envia aviso no #anuncios")
    .addStringOption((o) => o.setName("mensagem").setDescription("O aviso").setRequired(true)),
  async execute(interaction) {
    const mensagem = interaction.options.getString("mensagem");
    await interaction.deferReply({ ephemeral: true });
    try {
      const channels = await interaction.guild.channels.fetch();
      const anuncios = channels.find((c) => c.name === "anuncios" && c.type === ChannelType.GuildText);
      if (!anuncios) return interaction.editReply("❌ Canal #anuncios não encontrado.");
      await anuncios.send({
        content: "@here",
        embeds: [{
          title: "📢 Aviso",
          description: mensagem,
          color: 0xEB459E,
          footer: { text: `Enviado por ${interaction.user.username}` },
          timestamp: new Date().toISOString(),
        }],
      });
      await interaction.editReply("✅ Aviso enviado em #anuncios.");
    } catch (err) { await interaction.editReply(`❌ ${err.message}`); }
  },
};
