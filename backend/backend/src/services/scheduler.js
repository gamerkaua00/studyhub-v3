// StudyHub v3 — services/scheduler.js
require("dotenv").config();
const Content = require("../models/Content");
const Message = require("../models/Message");
const {
  sendMainNotification, sendDayBeforeNotification,
  sendExamPoll, sendScheduledMessage, sendMonthlyAgenda,
} = require("./discordNotifier");

const getBrasiliaDateTime = () => {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const date = brt.toISOString().split("T")[0];
  const time = brt.toISOString().split("T")[1].substring(0, 5);
  return { date, time, brt };
};

const getTomorrowBrasilia = () => {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  brt.setDate(brt.getDate() + 1);
  return brt.toISOString().split("T")[0];
};

const getDateDaysFromNow = (days) => {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  brt.setDate(brt.getDate() + days);
  return brt.toISOString().split("T")[0];
};

const runScheduler = async () => {
  try {
    const { date, time } = getBrasiliaDateTime();
    const tomorrow = getTomorrowBrasilia();
    const threeDays = getDateDaysFromNow(3);

    // 1. Notificações principais no horário
    const dueContents = await Content.find({ date, time, "notifications.sentMain": false });
    for (const content of dueContents) {
      await sendMainNotification(content);
      await Content.findByIdAndUpdate(content._id, { $set: { "notifications.sentMain": true } });
    }

    // 2. Aviso de prova amanhã (às 08:00)
    if (time === "08:00") {
      const tomorrowExams = await Content.find({ date: tomorrow, type: "Prova", "notifications.sentDayBefore": false });
      for (const exam of tomorrowExams) {
        await sendDayBeforeNotification(exam);
        await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
      }
    }

    // 3. Enquete 3 dias antes (às 19:00)
    if (time === "19:00") {
      const upcomingExams = await Content.find({ date: threeDays, type: "Prova", "notifications.sentPoll": false });
      for (const exam of upcomingExams) {
        await sendExamPoll(exam);
        await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentPoll": true } });
      }
    }

    // 4. Resumo semanal (segundas às 07:00)
    if (time === "07:00") {
      const now = new Date();
      const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      if (brt.getDay() === 1) { // Segunda-feira
        await sendWeeklySummary(date);
      }
    }

    // 5. Mensagens programadas pelo admin
    const dueMessages = await Message.find({ date, time, sent: false });
    for (const msg of dueMessages) {
      await sendScheduledMessage(msg);
      await Message.findByIdAndUpdate(msg._id, { $set: { sent: true } });
    }

    if (dueContents.length > 0 || dueMessages.length > 0) {
      console.log(`[Scheduler] ${dueContents.length} notif(s), ${dueMessages.length} msg(s) enviadas`);
    }
  } catch (err) {
    console.error("[Scheduler] Erro:", err.message);
  }
};

const sendWeeklySummary = async (today) => {
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const endStr = endOfWeek.toISOString().split("T")[0];

  const contents = await Content.find({ date: { $gte: today, $lte: endStr } }).sort({ date: 1 });
  if (!contents.length) return;

  const { sendDiscordNotification } = require("./discordNotifier");
  const typeEmoji = { Aula: "📖", "Revisão": "🔄", Prova: "📝" };
  const lines = contents.map((c) => {
    const [y, m, d] = c.date.split("-");
    return `${typeEmoji[c.type] || "📚"} **${d}/${m}** ${c.time} — ${c.title} *(${c.subject})*`;
  }).join("\n");

  const embed = {
    title: "📆 Resumo da Semana",
    description: lines,
    color: 0x9B59B6,
    timestamp: new Date().toISOString(),
    footer: { text: `StudyHub • ${contents.length} item(ns) esta semana` },
  };
  await sendDiscordNotification("agenda", "@here 📆 Resumo da semana:", embed);
};

module.exports = { runScheduler };
