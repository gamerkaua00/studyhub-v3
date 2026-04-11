const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("clear").setDescription("Apaga mensagens do canal (Admin)")
    .addIntegerOption((o) => o.setName("quantidade").setDescription("Número de mensagens (1-100)").setMinValue(1).setMaxValue(100).setRequired(true)),
  async execute(interaction) {
    const qtd = interaction.options.getInteger("quantidade");
    try {
      await interaction.channel.bulkDelete(qtd, true);
      const reply = await interaction.reply({ content: `✅ **${qtd}** mensagem(ns) apagada(s).`, fetchReply: true });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch (err) {
      interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true });
    }
  },
};
