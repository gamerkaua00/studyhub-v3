// ============================================================
// StudyHub v2 — services/setupServer.js
// Cria categorias, canais de texto, salas de voz e cargos
// ============================================================

const { ChannelType, PermissionsBitField } = require("discord.js");

const SERVER_STRUCTURE = [
  {
    category: "📋 Informações",
    channels: [
      { name: "regras",      adminOnly: true },
      { name: "bem-vindo",   adminOnly: true },
      { name: "anuncios",    adminOnly: true },
    ],
  },
  {
    category: "🤖 Bot",
    channels: [
      { name: "comandos",    adminOnly: false },
      { name: "admin-teste", adminOnly: true },
    ],
  },
  {
    category: "📚 Estudos",
    channels: [
      { name: "conteudos",   adminOnly: false },
      { name: "revisoes",    adminOnly: false },
      { name: "materiais",   adminOnly: false },
      { name: "duvidas",     adminOnly: false },
    ],
  },
  {
    category: "📅 Agenda",
    channels: [
      { name: "agenda",      adminOnly: false },
      { name: "avisos-provas", adminOnly: true },
    ],
  },
  {
    category: "💬 Bate Papo",
    channels: [
      { name: "geral",       adminOnly: false },
      { name: "off-topic",   adminOnly: false },
    ],
  },
  {
    category: "📢 Avisos",
    channels: [
      { name: "avisos-gerais", adminOnly: true },
    ],
  },
];

const VOICE_CATEGORY = "🔊 Salas de Estudo";
const VOICE_CHANNELS = [
  "📖 Sala de Estudo 1",
  "📖 Sala de Estudo 2",
  "📖 Sala de Estudo 3",
  "🎮 Sala Livre",
];

const ROLES = [
  { name: "Admin",     color: "#ED4245", hoist: true },
  { name: "Estudante", color: "#5865F2", hoist: true },
  { name: "Amigo",     color: "#57F287", hoist: true },
];

const setupServer = async (guild) => {
  try {
    console.log(`[Setup] Iniciando configuração de "${guild.name}"...`);

    const existingChannels = await guild.channels.fetch();
    const existingRoles    = await guild.roles.fetch();

    // ── 1. Cria cargos ────────────────────────────────────────
    for (const roleDef of ROLES) {
      const exists = existingRoles.find((r) => r.name === roleDef.name);
      if (!exists) {
        await guild.roles.create({
          name:        roleDef.name,
          color:       roleDef.color,
          hoist:       roleDef.hoist,
          mentionable: true,
        });
        console.log(`[Setup] ✅ Cargo criado: ${roleDef.name}`);
      } else {
        console.log(`[Setup] ⏭️  Cargo já existe: ${roleDef.name}`);
      }
    }

    // Recarrega roles após criação
    const roles = await guild.roles.fetch();
    const adminRole    = roles.find((r) => r.name === "Admin");
    const everyoneRole = guild.roles.everyone;

    // ── 2. Cria categorias e canais de texto ─────────────────
    for (const { category: categoryName, channels } of SERVER_STRUCTURE) {
      let category = existingChannels.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === categoryName
      );

      if (!category) {
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });
        console.log(`[Setup] ✅ Categoria criada: ${categoryName}`);
      }

      for (const ch of channels) {
        const exists = existingChannels.find(
          (c) => c.type === ChannelType.GuildText &&
                 c.name === ch.name &&
                 c.parentId === category.id
        );

        if (!exists) {
          const permissionOverwrites = [];

          if (ch.adminOnly) {
            // Bloqueia @everyone, libera só Admin
            permissionOverwrites.push(
              {
                id: everyoneRole.id,
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
              },
              adminRole
                ? { id: adminRole.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }
                : null,
            ).filter(Boolean);
          }

          await guild.channels.create({
            name: ch.name,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites,
          });
          console.log(`[Setup]   ✅ Canal criado: #${ch.name}${ch.adminOnly ? " (admin)" : ""}`);
        } else {
          console.log(`[Setup]   ⏭️  Canal já existe: #${ch.name}`);
        }
      }
    }

    // ── 3. Cria categoria e salas de voz ─────────────────────
    let voiceCat = existingChannels.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === VOICE_CATEGORY
    );

    if (!voiceCat) {
      voiceCat = await guild.channels.create({
        name: VOICE_CATEGORY,
        type: ChannelType.GuildCategory,
      });
      console.log(`[Setup] ✅ Categoria de voz criada: ${VOICE_CATEGORY}`);
    }

    for (const vcName of VOICE_CHANNELS) {
      const exists = existingChannels.find(
        (c) => c.type === ChannelType.GuildVoice &&
               c.name === vcName &&
               c.parentId === voiceCat.id
      );
      if (!exists) {
        await guild.channels.create({
          name: vcName,
          type: ChannelType.GuildVoice,
          parent: voiceCat.id,
          userLimit: vcName.includes("Livre") ? 0 : 10,
        });
        console.log(`[Setup]   ✅ Sala de voz criada: ${vcName}`);
      } else {
        console.log(`[Setup]   ⏭️  Sala de voz já existe: ${vcName}`);
      }
    }

    // ── 4. Envia mensagem de boas-vindas e regras ─────────────
    await sendWelcomeMessages(guild, existingChannels);

    console.log(`[Setup] 🎉 "${guild.name}" configurado com sucesso!\n`);
  } catch (err) {
    console.error(`[Setup] ❌ Erro:`, err.message);
  }
};

const sendWelcomeMessages = async (guild, existingChannels) => {
  // Recarrega canais após criação
  const channels = await guild.channels.fetch();

  const regrasChannel   = channels.find((c) => c.name === "regras" && c.type === ChannelType.GuildText);
  const bemVindoChannel = channels.find((c) => c.name === "bem-vindo" && c.type === ChannelType.GuildText);
  const comandosChannel = channels.find((c) => c.name === "comandos" && c.type === ChannelType.GuildText);

  // Envia regras (só se o canal estiver vazio)
  if (regrasChannel) {
    const msgs = await regrasChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await regrasChannel.send({
        embeds: [{
          title: "📋 Regras do Servidor",
          description:
            "**1.** Respeite todos os membros.\n" +
            "**2.** Use os canais corretos para cada assunto.\n" +
            "**3.** Comandos do bot apenas em #comandos.\n" +
            "**4.** Não envie spam ou conteúdo inapropriado.\n" +
            "**5.** Dúvidas sobre estudos em #duvidas.\n\n" +
            "*O descumprimento das regras pode resultar em punição.*",
          color: 0x5865F2,
          footer: { text: "StudyHub • Servidor de Estudos" },
        }],
      });
    }
  }

  // Envia guia de comandos
  if (comandosChannel) {
    const msgs = await comandosChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await comandosChannel.send({
        embeds: [{
          title: "🤖 Comandos do StudyHub Bot",
          description: "Use os comandos abaixo neste canal:",
          color: 0x57F287,
          fields: [
            { name: "`!hoje`",     value: "Mostra os conteúdos de hoje",                   inline: false },
            { name: "`!agenda`",   value: "Próximos conteúdos agendados (`!agenda 10`)",   inline: false },
            { name: "`!provas`",   value: "Lista provas futuras com contagem regressiva",  inline: false },
            { name: "`!ajuda`",    value: "Mostra esta mensagem",                          inline: false },
          ],
          footer: { text: "StudyHub • Notificações automáticas no horário cadastrado" },
        }],
      });
    }
  }
};

module.exports = { setupServer };
