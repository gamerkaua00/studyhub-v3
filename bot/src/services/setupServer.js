// StudyHub v3 — setupServer.js — SEM DELETAR CANAIS
const { ChannelType, PermissionsBitField } = require("discord.js");
const { logInfo } = require("./logService");

// Apenas cria o que não existe — não deleta nada
const FIXED_STRUCTURE = [
  {
    category: "📋 Informações",
    channels: [
      { name: "regras",           perm: "readOnly"  },
      { name: "bem-vindo",        perm: "readOnly"  },
      { name: "anuncios",         perm: "readOnly"  },
    ],
  },
  {
    category: "📅 Agenda",
    channels: [
      { name: "agenda",           perm: "readOnly"  },
      { name: "avisos-provas",    perm: "readOnly"  }, // todos veem, só bot/admin envia
    ],
  },
  {
    category: "📁 Trabalhos",
    channels: [
      { name: "apresentacoes",    perm: "open"      },
      { name: "atividades",       perm: "open"      },
      { name: "avaliacoes",       perm: "readOnly"  },
      { name: "listas",           perm: "readOnly"  },
    ],
  },
  {
    category: "📚 Estudos",
    channels: [
      { name: "conteudos",        perm: "readOnly"  },
      { name: "materiais",        perm: "open"      },
      { name: "duvidas",          perm: "open"      },
    ],
  },
  {
    category: "🎓 TCC",
    channels: [
      { name: "tcc",              perm: "tccOnly"   },
    ],
  },
  {
    category: "🤖 Bot",
    channels: [
      { name: "central-comandos", perm: "readOnly"  },
      { name: "use-aqui",         perm: "open"      },
      { name: "admin-bot",        perm: "adminOnly" },
      { name: "admin-cmds",       perm: "adminOnly" }, // canal privado de comandos admin
      { name: "log-bot",          perm: "adminOnly" },
    ],
  },
];

const VOICE_CATEGORY = "🔊 Salas de Estudo";
const VOICE_CHANNELS = [
  "📖 Sala de Estudo 1",
  "📖 Sala de Estudo 2",
  "📖 Sala de Estudo 3",
  "📖 Sala de Estudo 4",
];

const ROLES = [
  { name: "Admin",     color: "#ED4245", hoist: true  },
  { name: "Estudante", color: "#5865F2", hoist: true  },
  { name: "Amigo",     color: "#57F287", hoist: true  },
  { name: "TCC",       color: "#9B59B6", hoist: false },
];

const buildPerms = (perm, everyoneId, adminRole, tccRole) => {
  const SEND = PermissionsBitField.Flags.SendMessages;
  const VIEW = PermissionsBitField.Flags.ViewChannel;
  if (perm === "open")      return [];
  if (perm === "readOnly")  {
    // Todos VEEM, só admin envia
    const ow = [
      { id: everyoneId, deny: [SEND], allow: [VIEW] },
    ];
    if (adminRole) ow.push({ id: adminRole.id, allow: [SEND, VIEW] });
    return ow;
  }
  if (perm === "adminOnly") {
    const ow = [{ id: everyoneId, deny: [VIEW, SEND] }];
    if (adminRole) ow.push({ id: adminRole.id, allow: [VIEW, SEND] });
    return ow;
  }
  if (perm === "tccOnly") {
    const ow = [{ id: everyoneId, deny: [VIEW, SEND] }];
    if (adminRole) ow.push({ id: adminRole.id, allow: [VIEW, SEND] });
    if (tccRole)   ow.push({ id: tccRole.id,   allow: [VIEW, SEND] });
    return ow;
  }
  return [];
};

const setupServer = async (guild, client) => {
  try {
    console.log(`[Setup] Configurando "${guild.name}"...`);
    let existingChannels = await guild.channels.fetch();
    const existingRoles  = await guild.roles.fetch();

    // 1. Cargos
    for (const roleDef of ROLES) {
      const exists = existingRoles.find((r) => r.name === roleDef.name);
      if (!exists) {
        await guild.roles.create({ name: roleDef.name, color: roleDef.color, hoist: roleDef.hoist, mentionable: true });
        console.log(`[Setup] ✅ Cargo: ${roleDef.name}`);
      }
    }

    const roles      = await guild.roles.fetch();
    const adminRole  = roles.find((r) => r.name === "Admin");
    const tccRole    = roles.find((r) => r.name === "TCC");
    const everyoneId = guild.roles.everyone.id;

    // 2. Categorias e canais (só cria se não existir)
    for (const { category: catName, channels } of FIXED_STRUCTURE) {
      existingChannels = await guild.channels.fetch();
      let category = existingChannels.find((c) => c.type === ChannelType.GuildCategory && c.name === catName);
      if (!category) {
        category = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory });
        console.log(`[Setup] ✅ Categoria: ${catName}`);
      }

      for (const ch of channels) {
        existingChannels = await guild.channels.fetch();
        const existing = existingChannels.find((c) =>
          c.type === ChannelType.GuildText && c.name === ch.name
        );
        const perms = buildPerms(ch.perm, everyoneId, adminRole, tccRole);
        if (!existing) {
          await guild.channels.create({ name: ch.name, type: ChannelType.GuildText, parent: category.id, permissionOverwrites: perms });
          console.log(`[Setup]   ✅ Canal criado: #${ch.name} (${ch.perm})`);
        } else {
          // Atualiza permissões do canal existente
          try {
            await existing.permissionOverwrites.set(perms);
            console.log(`[Setup]   🔄 Permissões atualizadas: #${ch.name} (${ch.perm})`);
          } catch (e) { console.warn(`[Setup]   ⚠️ Não foi possível atualizar #${ch.name}: ${e.message}`); }
        }
      }
    }

    // 3. Salas de voz
    existingChannels = await guild.channels.fetch();
    let voiceCat = existingChannels.find((c) => c.type === ChannelType.GuildCategory && c.name === VOICE_CATEGORY);
    if (!voiceCat) voiceCat = await guild.channels.create({ name: VOICE_CATEGORY, type: ChannelType.GuildCategory });

    for (const vcName of VOICE_CHANNELS) {
      existingChannels = await guild.channels.fetch();
      const exists = existingChannels.find((c) => c.type === ChannelType.GuildVoice && c.name === vcName);
      if (!exists) {
        await guild.channels.create({ name: vcName, type: ChannelType.GuildVoice, parent: voiceCat.id, userLimit: 10 });
        console.log(`[Setup]   ✅ Sala voz: ${vcName}`);
      }
    }

    // 4. Canais de atendimento do backend
    await ensureAttendanceChannels(guild, adminRole, everyoneId);

    // 5. Mensagens fixas nos canais
    existingChannels = await guild.channels.fetch();
    await sendFixedMessages(guild, existingChannels);

    console.log(`[Setup] 🎉 "${guild.name}" pronto!\n`);
    if (client) await logInfo(client, `✅ Servidor "${guild.name}" configurado.`);
  } catch (err) {
    console.error(`[Setup] ❌ Erro:`, err.message);
  }
};

const ensureAttendanceChannels = async (guild, adminRole, everyoneId) => {
  try {
    const https = require("https");
    const http  = require("http");
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

    const attendances = await new Promise((resolve) => {
      const url = new URL(BACKEND_URL + "/api/public/attendance");
      const lib = url.protocol === "https:" ? https : http;
      const req = lib.get(url.href, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data).data || []); } catch { resolve([]); } });
      });
      req.on("error", () => resolve([]));
      req.setTimeout(6000, () => { req.destroy(); resolve([]); });
    });

    if (!attendances.length) return;

    const channels = await guild.channels.fetch();
    let atendCat = channels.find((c) => c.type === ChannelType.GuildCategory && c.name === "🏫 Atendimento");
    if (!atendCat) {
      atendCat = await guild.channels.create({ name: "🏫 Atendimento", type: ChannelType.GuildCategory });
      console.log("[Setup] ✅ Categoria: 🏫 Atendimento");
    }

    for (const att of attendances) {
      const chName = att.discordChannel;
      if (!chName) continue;
      const refreshed = await guild.channels.fetch();
      const exists = refreshed.find((c) => c.name.toLowerCase() === chName.toLowerCase() && c.type === ChannelType.GuildText);
      if (!exists) {
        const newCh = await guild.channels.create({
          name: chName,
          type: ChannelType.GuildText,
          parent: atendCat.id,
          permissionOverwrites: [
            { id: everyoneId, deny: [PermissionsBitField.Flags.SendMessages] },
            ...(adminRole ? [{ id: adminRole.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }] : []),
          ],
        });
        const days = att.days?.join(", ") || "A definir";
        await newCh.send({ embeds: [{
          title: `📋 Atendimento — ${att.subject}`,
          color: 0x1ABC9C,
          fields: [
            { name: "👨‍🏫 Professor", value: att.teacher,                        inline: true  },
            { name: "🏫 Sala",       value: att.room || "A definir",             inline: true  },
            { name: "📅 Dias",       value: days,                                inline: false },
            { name: "🕐 Horário",    value: `${att.startTime} — ${att.endTime}`, inline: true  },
            ...(att.notes ? [{ name: "📝 Obs", value: att.notes, inline: false }] : []),
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "StudyHub • Painel de Atendimento" },
        }] });
        console.log(`[Setup]   ✅ Atendimento: #${chName}`);
      }
    }
  } catch (err) {
    console.error("[Setup] Erro atendimento:", err.message);
  }
};

const sendFixedMessages = async (guild, channels) => {
  const find = (name) => channels.find((c) => c.name === name && c.type === ChannelType.GuildText);
  const regras  = find("regras");
  const bemVindo = find("bem-vindo");
  const central = find("central-comandos");
  const useAqui = find("use-aqui");

  if (regras) {
    const msgs = await regras.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await regras.send({ embeds: [{ title: "📋 Regras — StudyHub IFPR",
        description: "Leia com atenção. O descumprimento pode resultar em **advertência, silenciamento ou banimento**.", color: 0x5865F2,
        fields: [
          { name: "1️⃣ Respeito",         value: "Trate todos com educação. Sem xingamentos, ofensas ou discriminação.", inline: false },
          { name: "2️⃣ Canais corretos",   value: "• Comandos em **#use-aqui**\n• Dúvidas em **#duvidas**\n• TCC em **#tcc** (cargo necessário)", inline: false },
          { name: "3️⃣ Sem spam",          value: "Sem mensagens repetidas, flood ou links suspeitos.", inline: false },
          { name: "4️⃣ Conteúdo adequado", value: "Proibido conteúdo adulto, violento ou ilegal.", inline: false },
          { name: "5️⃣ Salas de voz",      value: "Respeite quem está estudando.", inline: false },
          { name: "6️⃣ Administração",     value: "Siga os admins. Dúvidas? **@Admin**.", inline: false },
        ],
        footer: { text: "StudyHub IFPR • Ao participar você concorda com estas regras." },
        timestamp: new Date().toISOString() }] });
    }
  }

  if (bemVindo) {
    const msgs = await bemVindo.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await bemVindo.send({ embeds: [{
          author: { name: "📚 StudyHub IFPR" },
          title: "Bem-vindo(a) ao servidor de estudos!",
          description:
            "Este é o espaço oficial do grupo para organizar os estudos.\n\n" +
            "**O que você encontra aqui:**\n" +
            "📅 Agenda de aulas, provas e atividades atualizada automaticamente\n" +
            "🔔 Notificações automáticas no horário certo\n" +
            "🏫 Canais de atendimento por matéria\n" +
            "📖 Salas de voz para estudar em grupo\n\n" +
            "*Você recebeu o cargo **Estudante** automaticamente. Bons estudos!* 📚",
          color: 0x57F287,
          fields: [
            { name: "🚀 Por onde começar?", value: "① Leia as regras em **#regras**\n② Use comandos em **#use-aqui**\n③ Veja a agenda em **#agenda**", inline: false },
          ],
          image: { url: "https://i.imgur.com/placeholder.png" },
          footer: { text: "StudyHub IFPR • Sistema de Estudos v3.1.2" },
          timestamp: new Date().toISOString() }] });
    }
  }

  if (central) {
    const msgs = await central.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await central.send({ embeds: [{ title: "🤖 Central de Comandos",
        description: "Use os comandos em **#use-aqui**. Aqui fica só a referência.", color: 0x5865F2,
        fields: [
          { name: "📅 `/hoje` ou `!hoje`",    value: "Conteúdos agendados para hoje",      inline: false },
          { name: "📆 `/agenda` ou `!agenda`", value: "Próximos conteúdos",                 inline: false },
          { name: "📝 `/provas` ou `!provas`", value: "Provas com contagem regressiva",     inline: false },
          { name: "📊 `/status`",              value: "Uptime e status do bot",             inline: false },
          { name: "❓ `/ajuda` ou `!ajuda`",   value: "Lista completa de comandos",          inline: false },
          { name: "🛡️ Admin: `/clear /mute /cargo`", value: "Moderação (requer @Admin)", inline: false },
        ],
        footer: { text: "StudyHub v3" }, timestamp: new Date().toISOString() }] });
    }
  }

  if (useAqui) {
    const msgs = await useAqui.messages.fetch({ limit: 1 });
    if (msgs.size === 0) {
      await useAqui.send({ embeds: [{ title: "💬 Use os comandos aqui!",
        description: "Digite `/` para ver todos os comandos com autocompletar.\n\n`!hoje` `!agenda` `!provas` `!ajuda`\n`/hoje` `/agenda` `/provas` `/status` `/ajuda`\n\n⚠️ Comandos em outros canais serão deletados.",
        color: 0x57F287, footer: { text: "StudyHub v3" } }] });
    }
  }
};

module.exports = { setupServer, ensureAttendanceChannels };
