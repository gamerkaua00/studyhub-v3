// ============================================================
// StudyHub v2 — events/interactionCreate.js
// Processa cliques nos botões de seleção de cargo
// ============================================================

const { assignRole } = require("./guildMemberAdd");

module.exports = {
  name: "interactionCreate",
  once: false,

  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    // Botões de cargo: role_estudante_USERID ou role_amigo_USERID
    if (customId.startsWith("role_")) {
      const parts    = customId.split("_");
      const roleKey  = parts[1]; // "estudante" ou "amigo"
      const userId   = parts[2];

      // Só o próprio usuário pode clicar
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "❌ Este botão não é para você.",
          ephemeral: true,
        });
      }

      const roleName = roleKey === "estudante" ? "Estudante" : "Amigo";

      try {
        // Busca o membro no servidor
        const guild  = client.guilds.cache.first();
        const member = await guild.members.fetch(userId);

        await assignRole(member, roleName);

        await interaction.update({
          embeds: [{
            title: "✅ Cargo atribuído!",
            description: `Você recebeu o cargo **${roleName}** com sucesso!\nBem-vindo(a) ao servidor! 🎉`,
            color: 0x57F287,
          }],
          components: [], // Remove os botões
        });

        console.log(`[Interaction] ${interaction.user.tag} escolheu: ${roleName}`);
      } catch (err) {
        console.error("[Interaction] Erro ao atribuir cargo:", err.message);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao atribuir o cargo. Fale com um administrador.",
          ephemeral: true,
        });
      }
    }
  },
};
