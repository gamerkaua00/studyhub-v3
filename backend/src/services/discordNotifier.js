// StudyHub v3 — services/discordNotifier.js — CORRIGIDO
const https = require("https");
const http  = require("http");

const findChannelId = async (channelName) => {
  const guildId = process.env.DISCORD_GUILD_ID;
  const token   = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !token) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: "discord.com",
      path: `/api/v10/guilds/${guildId}/channels`,
      method: "GET",
      headers: { Authorization: `Bot ${token}` },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const channels = JSON.parse(data);
          if (!Array.isArray(channels)) { resolve(null); return; }
          const name  = channelName.replace("#", "").toLowerCase().trim();
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
      hostname: "discord.com",
      path: `/api/v10/channels/${channelId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          // Se tiver id, foi enviado com sucesso
          resolve(parsed?.id ? parsed : null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
};

// Retorna o objeto da mensagem enviada (ou null se falhou)
const sendDiscordNotification = async (channelName, content = "", embed = null) => {
  if (!process.env.DISCORD_BOT_TOKEN) { console.warn("[Notifier] Token não configurado"); return null; }
  const channelId = await findChannelId(channelName);
  if (!channelId) {
    console.warn(`[Notifier] Canal não encontrado: "${channelName}"`);
    return null;
  }
  return sendToChannelId(channelId, { content, embeds: embed ? [embed] : [] });
};

const TYPE_EMOJI = { Aula:"📖", "Revisão":"🔄", Prova:"📝", Apresentação:"🎤", Atividade:"📋", Avaliação:"📊", Lista:"📃" };

const sendMainNotification = async (content) => {
  const emoji = TYPE_EMOJI[content.type] || "📚";
  const [y, m, d] = content.date.split("-");
  const embed = {
    title: `${emoji} ${content.title}`,
    color: parseInt((content.subjectColor || "#5865F2").replace("#", ""), 16),
    fields: [
      { name: "📌 Matéria", value: content.subject,  inline: true },
      { name: "🏷️ Tipo",   value: content.type,      inline: true },
      { name: "🕐 Horário", value: content.time,     inline: true },
      { name: "📅 Data",    value: `${d}/${m}/${y}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Notificação automática" },
  };
  if (content.description) embed.description = content.description;
  if (content.resourceLink) embed.fields.push({ name: "🔗 Material", value: `[Acessar](${content.resourceLink})`, inline: false });

  const ping = content.type === "Prova" || content.type === "Avaliação" ? "@here 📢 **HOJE!**\n" : "";
  const ch   = content.discordChannel || "conteudos";
  return sendDiscordNotification(ch, ping, embed);
};

const sendDayBeforeNotification = async (content) => {
  const [y, m, d] = content.date.split("-");
  const embed = {
    title: `⚠️ Prova Amanhã — ${content.subject}`,
    description: `**${content.title}**`,
    color: 0xFEE75C,
    fields: [
      { name: "📅 Data",    value: `${d}/${m}/${y}`, inline: true },
      { name: "🕐 Horário", value: content.time,     inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Lembrete automático — 1 dia antes" },
  };
  return sendDiscordNotification(content.discordChannel || "avisos-provas", "@here 🔔 **Prova amanhã!**", embed);
};

const sendExamPoll = async (content) => {
  const embed = {
    title: "📊 Enquete de Estudos",
    description: `A prova de **${content.subject}** é em **3 dias**!\n\n**${content.title}**\n\nQuem já está estudando? Reaja com ✅ ou ❌`,
    color: 0xEB459E,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Enquete automática" },
  };
  return sendDiscordNotification(content.discordChannel || "avisos-provas", "", embed);
};

const sendScheduledMessage = async (message) => {
  const embed = {
    title: message.title || "📢 Aviso",
    description: message.content,
    color: parseInt((message.color || "#5865F2").replace("#", ""), 16),
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Mensagem programada" },
  };
  const result = await sendDiscordNotification(message.discordChannel, "", embed);
  if (!result) {
    console.error(`[Notifier] Mensagem programada não enviada. Canal: "${message.discordChannel}"`);
  }
  return result;
};

const sendGalleryPhoto = async (photo) => {
  const channelName = photo.subject
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [y, m, d] = photo.date.split("-");
  const typeLabel = { aula:"Aula", prova:"Prova", atividade:"Atividade", avaliacao:"Avaliação", apresentacao:"Apresentação", lista:"Lista", outro:"Outro" };
  const embed = {
    title: `📷 ${photo.subject} • ${d}/${m}/${y}`,
    description: photo.title || photo.description || `Foto de ${typeLabel[photo.photoType] || "aula"}`,
    color: 0x3498DB,
    image: { url: photo.imageUrl },
    timestamp: new Date().toISOString(),
    footer: { text: `StudyHub • ${typeLabel[photo.photoType] || "Galeria"}` },
  };
  return sendDiscordNotification(channelName, "", embed);
};

const notifyAdminNewRequest = async (username) => {
  const embed = {
    title: "🔔 Novo pedido de cadastro",
    description: `**${username}** quer se cadastrar. Acesse o painel para aprovar ou rejeitar.`,
    color: 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Sistema de cadastro" },
  };
  return sendDiscordNotification("admin-bot", "", embed);
};

const updateAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) return null;
  const days = attendance.days?.join(", ") || "A definir";
  const embed = {
    title: `📋 Atendimento — ${attendance.subject}`,
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher,                        inline: true  },
      { name: "🏫 Sala",       value: attendance.room || "A definir",             inline: true  },
      { name: "📅 Dias",       value: days,                                       inline: false },
      { name: "🕐 Horário",    value: `${attendance.startTime} — ${attendance.endTime}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Painel de Atendimento" },
  };
  if (attendance.notes) embed.fields.push({ name: "📝 Obs", value: attendance.notes, inline: false });
  return sendDiscordNotification(channelName, "", embed);
};

const sendMonthlyAgenda = async (contents, month, year) => {
  if (!contents?.length) return null;
  const byDate = {};
  for (const c of contents) {
    if (!byDate[c.date]) byDate[c.date] = [];
    byDate[c.date].push(c);
  }
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const fields = Object.entries(byDate).map(([date, items]) => {
    const [y, m, d] = date.split("-");
    const lines = items.map((c) => `${TYPE_EMOJI[c.type] || "📚"} **${c.time}** — ${c.title} *(${c.subject})*`).join("\n");
    return { name: `📅 ${d}/${m}`, value: lines.substring(0, 1024), inline: false };
  });

  const chunks = [];
  for (let i = 0; i < fields.length; i += 10) chunks.push(fields.slice(i, i + 10));

  for (let i = 0; i < chunks.length; i++) {
    await sendDiscordNotification("agenda", "", {
      title: i === 0 ? `📅 Agenda — ${months[month - 1]} ${year}` : `📅 Agenda — continuação`,
      color: 0x5865F2,
      fields: chunks[i],
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub • ${contents.length} item(ns) no mês` },
    });
  }
};

const sendErrorLog = async (title, description, critical = false) => {
  const embed = {
    title: `${critical ? "🚨" : "⚠️"} ${title}`,
    description,
    color: critical ? 0xED4245 : 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Log de Sistema" },
  };
  return sendDiscordNotification("log-bot", "", embed);
};

module.exports = {
  sendDiscordNotification, sendMainNotification, sendDayBeforeNotification,
  sendExamPoll, sendScheduledMessage, sendGalleryPhoto, notifyAdminNewRequest,
  updateAttendancePanel, sendMonthlyAgenda, sendErrorLog, findChannelId,
};
