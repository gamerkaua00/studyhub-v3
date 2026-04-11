// StudyHub v3 — slashCommands/avisar.js (admin)
const { SlashCommandBuilder, ChannelType } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("avisar")
    .setDescription("Envia aviso em um canal (Admin)")
    .addStringOption((o) => o.setName("mensagem").setDescription("Texto do aviso").setRequired(true))
    .addChannelOption((o) => o.setName("canal").setDescription("Canal destino (padrão: anuncios)").addChannelTypes(ChannelType.GuildText))
    .addStringOption((o) => o.setName("titulo").setDescription("Título do aviso").setRequired(false)),
  async execute(interaction) {
    const mensagem = interaction.options.getString("mensagem");
    const titulo   = interaction.options.getString("titulo") || "📢 Aviso";
    const canal    = interaction.options.getChannel("canal") || interaction.guild.channels.cache.find((c) => c.name === "anuncios");
    if (!canal) return interaction.reply({ content: "❌ Canal não encontrado.", ephemeral: true });
    try {
      await canal.send({ embeds: [{ title: titulo, description: mensagem, color: 0xFEE75C, timestamp: new Date().toISOString(), footer: { text: `Enviado por ${interaction.user.username}` } }] });
      interaction.reply({ content: `✅ Aviso enviado em <#${canal.id}>`, ephemeral: true });
    } catch (err) {
      interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true });
    }
  },
};
