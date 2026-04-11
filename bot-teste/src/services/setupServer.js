// StudyHub v3 — services/setupServer.js
const { ChannelType, PermissionsBitField } = require("discord.js");

const STATIC_STRUCTURE = [
  {
    category: "📋 Informações",
    channels: [
      { name: "regras",          adminOnly: true,  readOnly: true  },
      { name: "bem-vindo",       adminOnly: true,  readOnly: true  },
      { name: "anuncios",        adminOnly: true,  readOnly: true  },
    ],
  },
  {
    category: "📚 Estudos",
    channels: [
      { name: "conteudos",       adminOnly: false, readOnly: true  },
      { name: "materiais",       adminOnly: false, readOnly: false },
      { name: "duvidas",         adminOnly: false, readOnly: false },
    ],
  },
  {
    category: "📁 Trabalhos",
    channels: [
      { name: "apresentacoes",   adminOnly: false, readOnly: false },
      { name: "atividades",      adminOnly: false, readOnly: false },
      { name: "avaliacoes",      adminOnly: true,  readOnly: true  },
      { name: "listas",          adminOnly: true,  readOnly: true  },
    ],
  },
  {
    category: "📅 Agenda",
    channels: [
      { name: "agenda",          adminOnly: true,  readOnly: true  },
      { name: "avisos-provas",   adminOnly: true,  readOnly: true  },
    ],
  },
  {
    category: "🤖 Bot",
    channels: [
      { name: "central-comandos",adminOnly: true,  readOnly: true  },
      { name: "use-aqui",        adminOnly: false, readOnly: false },
      { name: "admin-bot",       adminOnly: true,  readOnly: false },
      { name: "log-bot",         adminOnly: true,  readOnly: true  },
    ],
  },
];

const VOICE_CATEGORY = "🔊 Salas de Estudo";
const VOICE_CHANNELS  = [
  "📖 Sala de Estudo 1",
  "📖 Sala de Estudo 2",
  "📖 Sala de Estudo 3",
  "📖 Sala de Estudo 4",
];

const ROLES = [
  { name: "Admin",     color: "#ED4245", hoist: true  },
  { name: "Estudante", color: "#5865F2", hoist: true  },
  { name: "Amigo",     color: "#57F287", hoist: false },
];

const setupServer = async (guild, client) => {
  try {
    console.log(`[Setup] Configurando "${guild.name}"...`);
    const existingChannels = await guild.channels.fetch();
    const existingRoles    = await guild.roles.fetch();
    const everyoneId       = guild.roles.everyone.id;

    // 1. Cargos
    for (const roleDef of ROLES) {
      const exists = existingRoles.find((r) => r.name === roleDef.name);
      if (!exists) {
        await guild.roles.create({ name: roleDef.name, color: roleDef.color, hoist: roleDef.hoist, mentionable: true });
        console.log(`[Setup] Cargo criado: ${roleDef.name}`);
      }
    }

    const freshRoles = await guild.roles.fetch();
    const adminRole  = freshRoles.find((r) => r.name === "Admin");

    // 2. Canais estáticos
    for (const { category: catName, channels } of STATIC_STRUCTURE) {
      let cat = existingChannels.find((c) => c.type === ChannelType.GuildCategory && c.name === catName);
      if (!cat) {
        cat = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory });
        console.log(`[Setup] Categoria: ${catName}`);
      }

      for (const ch of channels) {
        const exists = existingChannels.find((c) => c.type === ChannelType.GuildText && c.name === ch.name && c.parentId === cat.id);
        if (!exists) {
          const perms = buildPerms(ch, everyoneId, adminRole);
          await guild.channels.create({ name: ch.name, type: ChannelType.GuildText, parent: cat.id, permissionOverwrites: perms });
          console.log(`[Setup]  Canal: #${ch.name}`);
        }
      }
    }

    // 3. Salas de voz
    let voiceCat = existingChannels.find((c) => c.type === ChannelType.GuildCategory && c.name === VOICE_CATEGORY);
    if (!voiceCat) {
      voiceCat = await guild.channels.create({ name: VOICE_CATEGORY, type: ChannelType.GuildCategory });
    }
    for (const vcName of VOICE_CHANNELS) {
      const exists = existingChannels.find((c) => c.type === ChannelType.GuildVoice && c.name === vcName);
      if (!exists) {
        await guild.channels.create({ name: vcName, type: ChannelType.GuildVoice, parent: voiceCat.id, userLimit: 10 });
        console.log(`[Setup]  Voz: ${vcName}`);
      }
    }

    // 4. Mensagens fixas
    await sendWelcomeMessages(guild, existingChannels);
    console.log(`[Setup] Configuração concluída!\n`);
  } catch (err) {
    console.error(`[Setup] Erro:`, err.message);
  }
};

// Monta permissões de canal
const buildPerms = (ch, everyoneId, adminRole) => {
  const perms = [];
  if (ch.adminOnly) {
    perms.push({ id: everyoneId, deny: [PermissionsBitField.Flags.ViewChannel] });
    if (adminRole) perms.push({ id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
  } else if (ch.readOnly) {
    perms.push({ id: everyoneId, deny: [PermissionsBitField.Flags.SendMessages] });
    if (adminRole) perms.push({ id: adminRole.id, allow: [PermissionsBitField.Flags.SendMessages] });
  }
  return perms;
};

// Cria canal de atendimento dinamicamente
const createAttendanceChannel = async (guild, channelName) => {
  try {
    const channels = await guild.channels.fetch();
    const catName  = "🏫 Atendimento";
    let cat = channels.find((c) => c.type === ChannelType.GuildCategory && c.name === catName);
    if (!cat) {
      cat = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory });
    }
    const exists = channels.find((c) => c.type === ChannelType.GuildText && c.name === channelName && c.parentId === cat.id);
    if (!exists) {
      const freshRoles = await guild.roles.fetch();
      const adminRole  = freshRoles.find((r) => r.name === "Admin");
      const everyoneId = guild.roles.everyone.id;
      // Canal de atendimento: todos veem, ninguém envia (só bot/admin)
      const perms = [
        { id: everyoneId, deny: [PermissionsBitField.Flags.SendMessages] },
      ];
      if (adminRole) perms.push({ id: adminRole.id, allow: [PermissionsBitField.Flags.SendMessages] });
      await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: cat.id, permissionOverwrites: perms });
      console.log(`[Setup] Canal de atendimento criado: #${channelName}`);
    }
  } catch (err) {
    console.error("[Setup] Erro ao criar canal de atendimento:", err.message);
  }
};

const sendWelcomeMessages = async (guild, existingChannels) => {
  const freshChannels   = await guild.channels.fetch();
  const regrasChannel   = freshChannels.find((c) => c.name === "regras"           && c.type === ChannelType.GuildText);
  const bemVindoChannel = freshChannels.find((c) => c.name === "bem-vindo"        && c.type === ChannelType.GuildText);
  const centralChannel  = freshChannels.find((c) => c.name === "central-comandos" && c.type === ChannelType.GuildText);
  const useAquiChannel  = freshChannels.find((c) => c.name === "use-aqui"         && c.type === ChannelType.GuildText);

  // Regras
  if (regrasChannel) {
    const msgs = await regrasChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await regrasChannel.send({
        embeds: [{
          title: "📋 Regras do Servidor",
          description: "Leia com atenção. O descumprimento resulta em advertência, silenciamento ou banimento.",
          color: 0x5865F2,
          fields: [
            { name: "1️⃣ Respeito", value: "Trate todos com educação. Não são tolerados xingamentos, ofensas, discriminação de qualquer tipo ou discussões agressivas.", inline: false },
            { name: "2️⃣ Canais corretos", value: `• Comandos do bot em **#use-aqui**\n• Dúvidas de matéria em **#duvidas**\n• Trabalhos e atividades em **#atividades**\n• Não envie conteúdo fora do contexto`, inline: false },
            { name: "3️⃣ Sem spam", value: "Não repita mensagens, não envie correntes, links suspeitos ou propagandas. Evite letras maiúsculas excessivas.", inline: false },
            { name: "4️⃣ Conteúdo adequado", value: "Proibido conteúdo adulto, violento ou ilegal. Avatares e nomes de usuário devem ser apropriados.", inline: false },
            { name: "5️⃣ Salas de voz", value: "Respeite quem está estudando. Evite sons irritantes ou interferências. Não entre em salas sem permissão.", inline: false },
            { name: "6️⃣ Administração", value: "Siga as orientações dos admins. Em caso de problemas, contate um **@Admin**. Não tente burlar as regras.", inline: false },
          ],
          footer: { text: "StudyHub • Ao participar, você concorda com estas regras." },
          timestamp: new Date().toISOString(),
        }],
      });
    }
  }

  // Bem-vindo
  if (bemVindoChannel) {
    const msgs = await bemVindoChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await bemVindoChannel.send({
        embeds: [{
          title: "🎓 Bem-vindo(a) ao StudyHub!",
          description:
            "Plataforma integrada de gerenciamento de estudos.\n\n" +
            "📅 **Agenda automática** — provas e aulas no horário certo\n" +
            "🔔 **Notificações automáticas** no Discord\n" +
            "📷 **Galeria de aulas** organizada por matéria\n" +
            "🏫 **Atendimento** — horários e salas dos professores\n" +
            "💬 **Tire dúvidas** com os colegas\n\n" +
            "Ao entrar você recebeu automaticamente o cargo **@Estudante**.",
          color: 0x57F287,
          fields: [
            {
              name: "📌 Primeiros passos",
              value:
                `1. Leia as **#regras**\n` +
                `2. Use os comandos do bot em **#use-aqui**\n` +
                `3. Veja a agenda em **#agenda**`,
              inline: false,
            },
          ],
          footer: { text: "StudyHub • Bons estudos! 📚" },
          timestamp: new Date().toISOString(),
        }],
      });
    }
  }

  // Central de comandos (painel fixo — leitura apenas)
  if (centralChannel) {
    const msgs = await centralChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await centralChannel.send({
        embeds: [{
          title: "🤖 StudyHub Bot — Central de Comandos",
          description: `Use os comandos em **#use-aqui**. Aqui ficam apenas as referências.\n\n⚠️ Comandos usados fora do **#use-aqui** serão deletados automaticamente.`,
          color: 0x5865F2,
          fields: [
            { name: "👥 Comandos para todos", value:
              "`/hoje` → Conteúdos de hoje\n" +
              "`/agenda` → Próximos conteúdos (use `/agenda quantidade:10` para mais)\n" +
              "`/provas` → Provas futuras com contagem regressiva\n" +
              "`/ajuda` → Lista todos os comandos\n" +
              "`/status` → Status e uptime do bot\n\n" +
              "_Também funcionam com `!hoje`, `!agenda`, `!provas`, `!ajuda`_",
              inline: false,
            },
            { name: "🛡️ Comandos de Admin", value:
              "`/clear [quantidade]` → Limpa mensagens do canal\n" +
              "`/mute @usuario [minutos]` → Silencia um membro\n" +
              "`/unmute @usuario` → Remove silenciamento\n" +
              "`/cargo @usuario [cargo]` → Atribui cargo\n" +
              "`/avisar [mensagem]` → Envia aviso no #anuncios",
              inline: false,
            },
          ],
          footer: { text: "StudyHub v3 • Comandos restritos ao #use-aqui" },
          timestamp: new Date().toISOString(),
        }],
      });
    }
  }

  // Mensagem de boas-vindas no #use-aqui
  if (useAquiChannel) {
    const msgs = await useAquiChannel.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await useAquiChannel.send({
        embeds: [{
          title: "💬 Canal de Comandos",
          description: "Use este canal para interagir com o bot!\nDigite `/` para ver todos os comandos disponíveis ou consulte **#central-comandos**.",
          color: 0x57F287,
          footer: { text: "StudyHub • Comandos com / ou !" },
        }],
      });
    }
  }
};

module.exports = { setupServer, createAttendanceChannel };
