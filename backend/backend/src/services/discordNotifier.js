// StudyHub v3 — services/discordNotifier.js
const https = require("https");

const findChannelId = async (channelName) => {
  const guildId = process.env.DISCORD_GUILD_ID;
  const token   = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !token) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: "discord.com",
      path: `/api/v10/guilds/${guildId}/channels`,
      method: "GET",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const channels = JSON.parse(data);
          const name = channelName.replace("#", "").toLowerCase();
          const found = channels.find((c) => c.name?.toLowerCase() === name && c.type === 0);
          resolve(found ? found.id : null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
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
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.write(payload);
    req.end();
  });
};

const sendDiscordNotification = async (channelName, content = "", embed = null) => {
  if (!process.env.DISCORD_BOT_TOKEN) return null;
  const channelId = await findChannelId(channelName);
  if (!channelId) { console.warn(`[Notifier] Canal "${channelName}" nao encontrado.`); return null; }
  return sendToChannelId(channelId, { content, embeds: embed ? [embed] : [] });
};

const sendMainNotification = async (content) => {
  const typeEmoji = { Aula: "📖", Revisao: "🔄", Prova: "📝" };
  const embed = {
    title: `${typeEmoji[content.type] || "📚"} ${content.title}`,
    color: parseInt((content.subjectColor || "#5865F2").replace("#", ""), 16),
    fields: [
      { name: "📌 Materia", value: content.subject, inline: true },
      { name: "🏷️ Tipo",   value: content.type,    inline: true },
      { name: "🕐 Horario", value: content.time,    inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub v3" },
  };
  if (content.description) embed.description = content.description;
  if (content.resourceLink) embed.fields.push({ name: "🔗 Material", value: `[Acessar](${content.resourceLink})`, inline: false });
  const ping = content.type === "Prova" ? "@here 📢 **PROVA HOJE!**\n" : "";
  await sendDiscordNotification(content.discordChannel, ping, embed);
};

const sendDayBeforeNotification = async (content) => {
  const embed = {
    title: "⚠️ Prova Amanha!",
    description: `**${content.title}**\nMateria: **${content.subject}**\nHorario: **${content.time}**`,
    color: 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Lembrete automatico" },
  };
  await sendDiscordNotification(content.discordChannel, "@here 🔔 **Lembrete: Prova amanha!**", embed);
};

const sendExamPoll = async (content) => {
  const embed = {
    title: "📊 Enquete de Estudos",
    description: `A prova de **${content.subject}** e em 3 dias!\n**${content.title}**\n\nQuem ja esta estudando?`,
    color: 0xEB459E,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Reaja com ✅ se ja estudou ou ❌ se ainda nao" },
  };
  await sendDiscordNotification(content.discordChannel, "", embed);
};

const sendScheduledMessage = async (message) => {
  const embed = {
    title: message.title || "📢 Aviso",
    description: message.content,
    color: parseInt((message.color || "#5865F2").replace("#", ""), 16),
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Mensagem programada" },
  };
  await sendDiscordNotification(message.discordChannel, "", embed);
};

const sendGalleryPhoto = async (photo) => {
  const channelName = photo.subject
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const [y, m, d] = photo.date.split("-");
  const embed = {
    title: `📷 ${photo.subject} • ${d}/${m}/${y}`,
    description: photo.title || photo.description || "Foto de aula",
    color: 0x3498DB,
    image: { url: photo.imageUrl },
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Galeria de Aulas" },
  };
  await sendDiscordNotification(channelName, "", embed);
};

const notifyAdminNewRequest = async (username, role) => {
  const embed = {
    title: "🔔 Novo pedido de cadastro",
    description: `**${username}** quer se cadastrar como **${role}**.`,
    color: 0xFEE75C,
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Sistema de cadastro" },
  };
  await sendDiscordNotification("admin-bot", "", embed);
};

const notifyBotCreateChannel = async (channelName, attendance) => {
  console.log(`[Notifier] Canal de atendimento solicitado: #${channelName}`);
};

const updateAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) return;
  const days = attendance.days?.join(", ") || "A definir";
  const embed = {
    title: `📋 Atendimento — ${attendance.subject}`,
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher, inline: true },
      { name: "🏫 Sala",      value: attendance.room || "A definir", inline: true },
      { name: "📅 Dias",      value: days, inline: true },
      { name: "🕐 Horario",   value: `${attendance.startTime} — ${attendance.endTime}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Painel de Atendimento" },
  };
  if (attendance.notes) embed.fields.push({ name: "📝 Obs", value: attendance.notes, inline: false });
  await sendDiscordNotification(channelName, "", embed);
};

const sendMonthlyAgenda = async (contents, month, year) => {
  if (!contents.length) return;
  const byDate = {};
  for (const c of contents) {
    if (!byDate[c.date]) byDate[c.date] = [];
    byDate[c.date].push(c);
  }
  const typeEmoji = { Aula: "📖", "Revisão": "🔄", Prova: "📝" };
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const fields = Object.entries(byDate).map(([date, items]) => {
    const [y, m, d] = date.split("-");
    const lines = items.map((c) => `${typeEmoji[c.type] || "📚"} **${c.time}** — ${c.title} *(${c.subject})*`).join("\n");
    return { name: `📅 ${d}/${m}`, value: lines, inline: false };
  });
  const chunks = [];
  for (let i = 0; i < fields.length; i += 10) chunks.push(fields.slice(i, i + 10));
  for (let i = 0; i < chunks.length; i++) {
    const embed = {
      title: i === 0 ? `📅 Agenda — ${months[month - 1]} ${year}` : `📅 Agenda (continuação)`,
      color: 0x5865F2,
      fields: chunks[i],
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub • ${contents.length} item(ns) no mês` },
    };
    await sendDiscordNotification("agenda", "", embed);
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
  await sendDiscordNotification("log-bot", "", embed);
};

module.exports = {
  sendDiscordNotification, sendMainNotification, sendDayBeforeNotification,
  sendExamPoll, sendScheduledMessage, sendGalleryPhoto, notifyAdminNewRequest,
  notifyBotCreateChannel, updateAttendancePanel, sendMonthlyAgenda, sendErrorLog,
  findChannelId,
};
