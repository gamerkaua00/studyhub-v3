const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("cargo").setDescription("Atribui cargo a um membro (Admin)")
    .addUserOption((o) => o.setName("usuario").setDescription("Membro").setRequired(true))
    .addStringOption((o) => o.setName("cargo").setDescription("Cargo").setRequired(true)
      .addChoices({ name: "Admin", value: "Admin" }, { name: "Estudante", value: "Estudante" }, { name: "Amigo", value: "Amigo" })),
  async execute(interaction) {
    const member    = interaction.options.getMember("usuario");
    const roleName  = interaction.options.getString("cargo");
    const roles     = await interaction.guild.roles.fetch();
    const role      = roles.find((r) => r.name === roleName);
    if (!role) return interaction.reply({ content: "❌ Cargo não encontrado.", ephemeral: true });
    try {
      await member.roles.add(role);
      interaction.reply({ embeds: [{ title: "✅ Cargo Atribuído", description: `<@${member.id}> recebeu o cargo **${roleName}**.`, color: 0x57F287, timestamp: new Date().toISOString() }] });
    } catch (err) {
      interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true });
    }
  },
};
