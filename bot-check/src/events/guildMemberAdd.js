// ============================================================
// StudyHub v2 — events/guildMemberAdd.js
// Quando alguém entra no servidor:
// 1. Manda DM perguntando o cargo
// 2. Avisa o canal #bem-vindo
// ============================================================

const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",
  once: false,

  async execute(member, client) {
    const guild = member.guild;

    console.log(`[MemberAdd] ${member.user.tag} entrou em ${guild.name}`);

    // ── Avisa no #bem-vindo ───────────────────────────────────
    const channels = await guild.channels.fetch();
    const bemVindo = channels.find(
      (c) => c.name === "bem-vindo" && c.type === ChannelType.GuildText
    );

    if (bemVindo) {
      await bemVindo.send({
        embeds: [{
          title: `👋 Bem-vindo(a), ${member.user.username}!`,
          description:
            `Olá <@${member.id}>! Seja bem-vindo(a) ao servidor de estudos.\n\n` +
            `📋 Leia as regras em <#${channels.find((c) => c.name === "regras")?.id || "regras"}>\n` +
            `🤖 Use os comandos do bot em <#${channels.find((c) => c.name === "comandos")?.id || "comandos"}>\n\n` +
            `*Você receberá uma mensagem privada para selecionar seu cargo.*`,
          color: 0x57F287,
          thumbnail: { url: member.user.displayAvatarURL() },
          timestamp: new Date().toISOString(),
          footer: { text: "StudyHub • Servidor de Estudos" },
        }],
      });
    }

    // ── Manda DM com botões de seleção de cargo ───────────────
    try {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`role_estudante_${member.id}`)
          .setLabel("📚 Estudante")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`role_amigo_${member.id}`)
          .setLabel("🤝 Amigo")
          .setStyle(ButtonStyle.Secondary),
      );

      await member.send({
        embeds: [{
          title: `👋 Olá, ${member.user.username}!`,
          description:
            `Bem-vindo(a) ao **${guild.name}**!\n\n` +
            `Por favor, selecione o seu perfil clicando em um dos botões abaixo.\n\n` +
            `📚 **Estudante** — Faz parte do grupo de estudos\n` +
            `🤝 **Amigo** — Amigo(a) do grupo, não é estudante\n\n` +
            `*Após selecionar, o cargo será atribuído automaticamente.*`,
          color: 0x5865F2,
          footer: { text: "StudyHub • Seleção de cargo" },
        }],
        components: [row],
      });

      console.log(`[MemberAdd] DM enviada para ${member.user.tag}`);
    } catch (err) {
      // Usuário pode ter DMs desativadas
      console.warn(`[MemberAdd] Não foi possível enviar DM para ${member.user.tag}:`, err.message);

      // Se não conseguiu enviar DM, atribui Estudante por padrão
      await assignRole(member, "Estudante");
    }
  },
};

// Função auxiliar exportada para uso no interactionCreate
const assignRole = async (member, roleName) => {
  try {
    const roles = await member.guild.roles.fetch();
    const role  = roles.find((r) => r.name === roleName);
    if (role) {
      await member.roles.add(role);
      console.log(`[MemberAdd] Cargo "${roleName}" atribuído para ${member.user.tag}`);
    }
  } catch (err) {
    console.error(`[MemberAdd] Erro ao atribuir cargo:`, err.message);
  }
};

module.exports.assignRole = assignRole;
