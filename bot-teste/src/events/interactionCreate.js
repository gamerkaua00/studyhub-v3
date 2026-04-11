// StudyHub v3 — events/interactionCreate.js
// Processa slash commands e botões de cargo
const { assignRole } = require("./guildMemberAdd");
const ALLOWED_CHANNEL = "use-aqui";
const ADMIN_SLASH     = ["clear", "mute", "cargo", "unmute"];

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
          const guild  = client.guilds.cache.first();
          const member = await guild.members.fetch(userId);
          await assignRole(member, roleName);
          await interaction.update({
            embeds: [{
              title: "✅ Cargo atribuído!",
              description: `Você recebeu o cargo **${roleName}**! Bem-vindo(a)! 🎉`,
              color: 0x57F287,
            }],
            components: [],
          });
        } catch (err) {
          await interaction.reply({ content: "❌ Erro ao atribuir cargo. Fale com um admin.", ephemeral: true });
        }
      }
      return;
    }

    // ── Slash commands ───────────────────────────────────────
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Verifica admin para comandos restritos
    const isAdmin = interaction.member?.roles.cache.some((r) => r.name === "Admin");
    if (ADMIN_SLASH.includes(interaction.commandName) && !isAdmin) {
      return interaction.reply({ content: "❌ Comando restrito a **@Admin**.", ephemeral: true });
    }

    // Restringe ao #use-aqui (exceto admins e ephemeral)
    if (!isAdmin && interaction.channel?.name !== ALLOWED_CHANNEL) {
      const useAquiChannel = interaction.guild?.channels.cache.find((c) => c.name === ALLOWED_CHANNEL);
      return interaction.reply({
        content: `❌ Use comandos no canal ${useAquiChannel ? `<#${useAquiChannel.id}>` : "#use-aqui"}!`,
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[Bot] Erro em /${interaction.commandName}:`, err.message);
      const msg = { content: "❌ Erro ao executar o comando.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
};
