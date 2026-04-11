// StudyHub v3 — events/guildMemberAdd.js
const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { logInfo } = require("../services/logService");

module.exports = {
  name: "guildMemberAdd",
  once: false,
  async execute(member, client) {
    const guild = member.guild;
    console.log(`[Bot] Novo membro: ${member.user.tag}`);

    // Atribui cargo Estudante automaticamente
    await assignRole(member, "Estudante");

    // Avisa no #bem-vindo
    const channels  = await guild.channels.fetch();
    const bemVindo  = channels.find((c) => c.name === "bem-vindo" && c.type === ChannelType.GuildText);
    if (bemVindo) {
      await bemVindo.send({
        embeds: [{
          title: `👋 Bem-vindo(a), ${member.user.username}!`,
          description: `Olá <@${member.id}>! Você recebeu automaticamente o cargo **Estudante**.\n\nLeia as regras e bons estudos! 📚`,
          color: 0x57F287,
          thumbnail: { url: member.user.displayAvatarURL() },
          timestamp: new Date().toISOString(),
          footer: { text: "StudyHub • Bem-vindo(a)!" },
        }],
      });
    }

    // Log
    await logInfo(client, `👋 Novo membro: **${member.user.tag}** (cargo Estudante atribuído)`);

    // DM opcional de boas-vindas com botão para mudar para Amigo
    try {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`role_amigo_${member.id}`)
          .setLabel("🤝 Sou Amigo do grupo")
          .setStyle(ButtonStyle.Secondary),
      );

      await member.send({
        embeds: [{
          title: `👋 Bem-vindo(a) ao StudyHub IFPR!`,
          description:
            `Você recebeu automaticamente o cargo **Estudante**.\n\n` +
            `Se você não é estudante do grupo e é apenas amigo, clique no botão abaixo para mudar seu cargo.\n\n` +
            `Caso contrário, pode fechar esta mensagem. 📚`,
          color: 0x5865F2,
          footer: { text: "StudyHub • Boas vindas!" },
        }],
        components: [row],
      });
    } catch {
      // DMs desativadas — sem problema, cargo já foi atribuído
    }
  },
};

const assignRole = async (member, roleName) => {
  try {
    const roles = await member.guild.roles.fetch();
    const role  = roles.find((r) => r.name === roleName);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      console.log(`[Bot] Cargo "${roleName}" → ${member.user.tag}`);
    }
  } catch (err) {
    console.error(`[Bot] Erro ao atribuir cargo:`, err.message);
  }
};

module.exports.assignRole = assignRole;
