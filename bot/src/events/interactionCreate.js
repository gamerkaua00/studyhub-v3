// StudyHub v3 — events/interactionCreate.js — CORRIGIDO
const ALLOWED_CHANNEL = "use-aqui";
const ADMIN_SLASH = [
  "clear", "mute", "cargo", "unmute",
  "avisar", "reenviar-agenda", "info-servidor"
];

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {

    // ── Botões de cargo ──────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;
      if (customId.startsWith("role_")) {
        const parts   = customId.split("_");
        const roleKey = parts[1];
        const userId  = parts[2];
        if (interaction.user.id !== userId) {
          return interaction.reply({ content: "❌ Este botão não é para você.", ephemeral: true });
        }
        const roleName = roleKey === "amigo" ? "Amigo" : "Estudante";
        try {
          const guild  = interaction.guild;
          const member = await guild.members.fetch(userId);
          const roles  = await guild.roles.fetch();
          const role   = roles.find((r) => r.name === roleName);
          if (role && !member.roles.cache.has(role.id)) await member.roles.add(role);
          await interaction.update({
            embeds: [{
              title: "✅ Cargo atribuído!",
              description: `Você recebeu o cargo **${roleName}**! Bem-vindo(a)! 🎉`,
              color: 0x57F287,
            }],
            components: [],
          });
        } catch (err) {
          await interaction.reply({ content: "❌ Erro ao atribuir cargo.", ephemeral: true });
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    const isAdmin = interaction.member?.roles.cache.some((r) => r.name === "Admin");

    // Verifica se é comando admin
    if (ADMIN_SLASH.includes(interaction.commandName) && !isAdmin) {
      return interaction.reply({ content: "❌ Comando restrito a **@Admin**.", ephemeral: true });
    }

    // Admins podem usar em qualquer canal
    // Não-admins só podem usar em #use-aqui
    if (!isAdmin) {
      const inAllowed = interaction.channel?.name === ALLOWED_CHANNEL;
      if (!inAllowed) {
        const ch = interaction.guild?.channels.cache.find((c) => c.name === ALLOWED_CHANNEL);
        return interaction.reply({
          content: `❌ Use comandos em ${ch ? `<#${ch.id}>` : "#use-aqui"}!`,
          ephemeral: true,
        });
      }
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[Bot] Erro em /${interaction.commandName}:`, err.message);
      const msg = { content: "❌ Erro ao executar o comando.", ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
      else await interaction.reply(msg);
    }
  },
};
