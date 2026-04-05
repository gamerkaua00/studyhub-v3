const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("[Admin] Remove silenciamento de um membro")
    .addUserOption((o) => o.setName("usuario").setDescription("Membro").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario");
    await interaction.deferReply({ ephemeral: true });
    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(null);
      await interaction.editReply(`✅ Silenciamento de **${user.username}** removido.`);
    } catch (err) { await interaction.editReply(`❌ ${err.message}`); }
  },
};
