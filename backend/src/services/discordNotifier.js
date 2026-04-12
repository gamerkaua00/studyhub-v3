// StudyHub v3.1.2 — services/discordNotifier.js
// Mensagens redesenhadas para serem bonitas e organizadas
const https = require("https");
const http  = require("http");

const TYPE_EMOJI  = { Aula:"📖",Revisão:"🔄",Prova:"📝",Apresentação:"🎤",Atividade:"📋",Avaliação:"📊",Lista:"📃" };
const TYPE_COLOR  = { Aula:0x5865F2,Revisão:0x57F287,Prova:0xED4245,Apresentação:0xEB459E,Atividade:0xFEE75C,Avaliação:0xE67E22,Lista:0x9B59B6 };
const MONTHS_PT   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const findChannelId = async (channelName) => {
  const guildId = process.env.DISCORD_GUILD_ID;
  const token   = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !token) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: "discord.com", path: `/api/v10/guilds/${guildId}/channels`,
      method: "GET", headers: { Authorization: `Bot ${token}` },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const channels = JSON.parse(data);
          if (!Array.isArray(channels)) { resolve(null); return; }
          const name  = channelName.replace("#","").toLowerCase().trim();
          const found = channels.find((c) => c.name?.toLowerCase() === name && c.type === 0);
          resolve(found ? found.id : null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
};

const sendToChannelId = (channelId, body) => {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const payload = JSON.stringify(body);
  return new Promise((resolve) => {
    const opts = {
      hostname: "discord.com", path: `/api/v10/channels/${channelId}/messages`,
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => { try { const p = JSON.parse(data); resolve(p?.id ? p : null); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
};

const sendDiscordNotification = async (channelName, content = "", embed = null) => {
  if (!process.env.DISCORD_BOT_TOKEN) return null;
  const channelId = await findChannelId(channelName);
  if (!channelId) { console.warn(`[Discord] Canal não encontrado: "${channelName}"`); return null; }
  return sendToChannelId(channelId, { content, embeds: embed ? [embed] : [] });
};

// ────────────────────────────────────────────────────────────
// NOTIFICAÇÃO PRINCIPAL — quando chega o horário
// ────────────────────────────────────────────────────────────
const sendMainNotification = async (content) => {
  const emoji   = TYPE_EMOJI[content.type] || "📚";
  const color   = TYPE_COLOR[content.type]  || 0x5865F2;
  const [y,m,d] = content.date.split("-");
  const isPriority = content.type === "Prova" || content.type === "Avaliação";

  const embed = {
    author: { name: `${emoji} ${content.type.toUpperCase()}` },
    title: content.title,
    color,
    fields: [
      { name: "📌 Matéria",  value: content.subject, inline: true  },
      { name: "📅 Data",     value: `${d}/${m}/${y}`, inline: true },
      { name: "🕐 Horário",  value: content.time,    inline: true  },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Notificação automática" },
  };

  if (content.description) embed.description = `> ${content.description}`;
  if (content.resourceLink) {
    embed.fields.push({ name: "🔗 Material de Apoio", value: `[Clique aqui para acessar](${content.resourceLink})`, inline: false });
  }

  const ping = isPriority ? "@here\n🚨 **Atenção!** " : "";
  const header = isPriority
    ? `${ping}**${content.type}** de **${content.subject}** agora!`
    : `📢 **${content.type}** de **${content.subject}**`;

  return sendDiscordNotification(content.discordChannel || "conteudos", header, embed);
};

// ────────────────────────────────────────────────────────────
// AVISO 30 MINUTOS ANTES
// ────────────────────────────────────────────────────────────
const sendThirtyMinNotification = async (content) => {
  const emoji   = TYPE_EMOJI[content.type] || "📚";
  const color   = TYPE_COLOR[content.type]  || 0xFEE75C;
  const [y,m,d] = content.date.split("-");

  const embed = {
    author: { name: "⏰ Lembrete — 30 minutos" },
    title: content.title,
    description: `**${content.type}** de **${content.subject}** começa em 30 minutos!`,
    color: 0xFEE75C,
    fields: [
      { name: "📌 Matéria",  value: content.subject, inline: true },
      { name: "🕐 Horário",  value: content.time,    inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Lembrete automático" },
  };

  return sendDiscordNotification(content.discordChannel || "conteudos", "", embed);
};

// ────────────────────────────────────────────────────────────
// AVISO D-1
// ────────────────────────────────────────────────────────────
const sendDayBeforeNotification = async (content) => {
  const [y,m,d] = content.date.split("-");
  const embed = {
    author: { name: "📅 Aviso — Prova Amanhã" },
    title: content.title,
    description: `A avaliação de **${content.subject}** acontece **amanhã**. Prepare-se!`,
    color: 0xFEE75C,
    fields: [
      { name: "📌 Matéria",  value: content.subject,    inline: true },
      { name: "📅 Data",     value: `${d}/${m}/${y}`,   inline: true },
      { name: "🕐 Horário",  value: content.time,       inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Lembrete D-1" },
  };
  return sendDiscordNotification(content.discordChannel || "avisos-provas", "@here ⚠️ **Prova amanhã!**", embed);
};

// ────────────────────────────────────────────────────────────
// ENQUETE D-3
// ────────────────────────────────────────────────────────────
const sendExamPoll = async (content) => {
  const [y,m,d] = content.date.split("-");
  const embed = {
    author: { name: "📊 Enquete de Estudos — D-3" },
    title: `${content.title}`,
    description:
      `A prova de **${content.subject}** acontece em **3 dias** (${d}/${m}/${y}).\n\n` +
      `React com ✅ se já está estudando ou ❌ se ainda não começou!`,
    color: 0xEB459E,
    fields: [
      { name: "🕐 Horário da Prova", value: content.time, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Enquete automática" },
  };
  return sendDiscordNotification(content.discordChannel || "avisos-provas", "", embed);
};

// ────────────────────────────────────────────────────────────
// MENSAGEM PROGRAMADA
// ────────────────────────────────────────────────────────────
const sendScheduledMessage = async (message) => {
  const embed = {
    author: { name: "📢 Mensagem Programada" },
    title: message.title || "Aviso",
    description: message.content,
    color: parseInt((message.color || "#5865F2").replace("#",""), 16),
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Mensagem agendada" },
  };
  const result = await sendDiscordNotification(message.discordChannel, "", embed);
  if (!result) console.error(`[Discord] Mensagem programada falhou. Canal: "${message.discordChannel}"`);
  return result;
};

// ────────────────────────────────────────────────────────────
// FOTO DA GALERIA
// ────────────────────────────────────────────────────────────
const sendGalleryPhoto = async (photo) => {
  const channelName = photo.subject
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
  const [y,m,d] = photo.date.split("-");
  const typeLabel = { aula:"Aula",prova:"Prova",atividade:"Atividade",avaliacao:"Avaliação",apresentacao:"Apresentação",lista:"Lista",outro:"Outro" };
  const embed = {
    author: { name: `📷 ${typeLabel[photo.photoType] || "Foto"} — ${photo.subject}` },
    title: photo.title || `${photo.subject} · ${d}/${m}/${y}`,
    description: photo.description || "",
    color: 0x3498DB,
    image: { url: photo.imageUrl },
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Galeria de Aulas" },
  };
  return sendDiscordNotification(channelName, "", embed);
};

// ────────────────────────────────────────────────────────────
// AGENDA MENSAL
// ────────────────────────────────────────────────────────────
const sendMonthlyAgenda = async (contents, month, year) => {
  if (!contents?.length) return null;
  const byDate = {};
  for (const c of contents) { if (!byDate[c.date]) byDate[c.date] = []; byDate[c.date].push(c); }
  const fields = Object.entries(byDate).slice(0, 25).map(([date, items]) => {
    const [y,m,d] = date.split("-");
    const lines = items.map((c) => `${TYPE_EMOJI[c.type]||"📚"} \`${c.time}\` **${c.title}** — *${c.subject}*`).join("\n");
    return { name: `📅 ${d}/${m}`, value: lines.substring(0,1024), inline: false };
  });
  const chunks = [];
  for (let i = 0; i < fields.length; i += 8) chunks.push(fields.slice(i, i+8));
  for (let i = 0; i < chunks.length; i++) {
    await sendDiscordNotification("agenda", "", {
      author: { name: `📅 Agenda — ${MONTHS_PT[month-1]} ${year}${chunks.length>1 ? ` (${i+1}/${chunks.length})` : ""}` },
      color: 0x5865F2,
      fields: chunks[i],
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub IFPR • ${contents.length} item(ns) no mês` },
    });
  }
  return true;
};

// ────────────────────────────────────────────────────────────
// PAINEL DE ATENDIMENTO
// ────────────────────────────────────────────────────────────
const sendAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) { console.warn(`[Discord] Canal de atendimento não definido: ${attendance.subject}`); return null; }
  const schedules = attendance.schedules?.length > 0
    ? attendance.schedules
    : [{ days: attendance.days||[], startTime: attendance.startTime||"08:00", endTime: attendance.endTime||"10:00", room: attendance.room||"", notes: attendance.notes||"" }];

  const scheduleFields = schedules.map((s, i) => {
    const days = Array.isArray(s.days) && s.days.length ? s.days.join(", ") : "A definir";
    const label = schedules.length > 1 ? `📅 Horário ${i+1}` : "📅 Horário";
    let val = `**${days}**\n\`${s.startTime}\` — \`${s.endTime}\``;
    if (s.room)  val += `\n🏫 ${s.room}`;
    if (s.notes) val += `\n📝 ${s.notes}`;
    return { name: label, value: val, inline: true };
  });

  const embed = {
    author: { name: "📋 Horário de Atendimento" },
    title: attendance.subject,
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher || "—", inline: false },
      ...scheduleFields,
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Atualizado automaticamente" },
  };

  const result = await sendDiscordNotification(channelName, "", embed);
  if (result) console.log(`[Discord] ✅ Atendimento enviado: #${channelName}`);
  else        console.warn(`[Discord] ⚠️ Canal #${channelName} não encontrado`);
  return result;
};

// ────────────────────────────────────────────────────────────
// NOVO MEMBRO / CADASTRO
// ────────────────────────────────────────────────────────────
const notifyAdminNewRequest = async (username, role) => {
  return sendDiscordNotification("admin-bot", "", {
    author: { name: "🔔 Novo Pedido de Acesso" },
    title: username,
    description: `**${username}** solicitou acesso ao sistema como **${role}**.\nAcesse o painel para aprovar ou rejeitar.`,
    color: 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Sistema de Cadastro" },
  });
};

// ────────────────────────────────────────────────────────────
// LOG DE ERROS
// ────────────────────────────────────────────────────────────
const sendErrorLog = async (title, description, critical = false) => {
  return sendDiscordNotification("log-bot", "", {
    author: { name: critical ? "🚨 Erro Crítico" : "⚠️ Aviso do Sistema" },
    title,
    description,
    color: critical ? 0xED4245 : 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub IFPR • Log de Sistema" },
  });
};

module.exports = {
  sendDiscordNotification, sendMainNotification, sendThirtyMinNotification,
  sendDayBeforeNotification, sendExamPoll, sendScheduledMessage, sendGalleryPhoto,
  sendMonthlyAgenda, sendAttendancePanel, notifyAdminNewRequest, sendErrorLog, findChannelId,
};
