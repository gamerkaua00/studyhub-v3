// StudyHub v3.1.1 — scheduler.js — COMPLETO
require("dotenv").config();
const Content = require("../models/Content");
const Message = require("../models/Message");
const { sendMainNotification, sendThirtyMinNotification, sendDayBeforeNotification, sendExamPoll, sendScheduledMessage, sendMonthlyAgenda, sendDiscordNotification } = require("./discordNotifier");

const getBRT      = () => new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
const getTodayBRT = () => getBRT().toISOString().split("T")[0];
const getTimeBRT  = () => getBRT().toISOString().split("T")[1].substring(0, 5);
const dateFromNow = (days) => { const b = getBRT(); b.setDate(b.getDate() + days); return b.toISOString().split("T")[0]; };

// Calcula HH:MM - N minutos
const subtractMinutes = (timeStr, mins) => {
  const [h, m] = timeStr.split(":").map(Number);
  const total  = h * 60 + m - mins;
  const nh     = Math.floor(total / 60) % 24;
  const nm     = total % 60;
  return `${String(nh).padStart(2,"0")}:${String(nm < 0 ? nm + 60 : nm).padStart(2,"0")}`;
};

const D1_TIMES = ["08:00", "17:00"];

const runScheduler = async () => {
  try {
    const today    = getTodayBRT();
    const time     = getTimeBRT();
    const tomorrow = dateFromNow(1);
    const threeDays = dateFromNow(3);

    // 1. Notificação no horário exato
    const dueContents = await Content.find({ date: today, time, "notifications.sentMain": false });
    for (const c of dueContents) {
      try {
        await sendMainNotification(c);
        await Content.findByIdAndUpdate(c._id, { $set: { "notifications.sentMain": true } });
        console.log(`[Scheduler] ✅ Notif: ${c.title}`);
      } catch (err) { console.error(`[Scheduler] ❌ Notif:`, err.message); }
    }

    // 2. Aviso 30 minutos antes
    const thirtyBefore = subtractMinutes(time, 30);
    const dueSoon = await Content.find({ date: today, time: thirtyBefore, "notifications.sentMain": false });
    for (const c of dueSoon) {
      try {
        const [y, m, d] = c.date.split("-");
        await sendThirtyMinNotification(c);
        console.log(`[Scheduler] ⏰ 30min antes: ${c.title}`);
      } catch (err) { console.error(`[Scheduler] ❌ 30min:`, err.message); }
    }

    // 3. D-1 às 08:00 e 17:00
    if (D1_TIMES.includes(time)) {
      const exams = await Content.find({ date: tomorrow, type: { $in: ["Prova","Avaliação"] }, "notifications.sentDayBefore": false });
      for (const exam of exams) {
        try {
          await sendDayBeforeNotification(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
          console.log(`[Scheduler] ✅ D-1 (${time}): ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ D-1:`, err.message); }
      }
    }

    // Catch-up: prova hoje, D-1 não enviado, horário não passou
    const missedD1 = await Content.find({ date: today, type: { $in: ["Prova","Avaliação"] }, "notifications.sentDayBefore": false });
    for (const exam of missedD1) {
      if (exam.time > time) {
        try {
          await sendDayBeforeNotification(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
          console.log(`[Scheduler] ✅ Catch-up D-1: ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ Catch-up:`, err.message); }
      }
    }

    // 4. Enquete D-3 às 19:00
    if (time === "19:00") {
      const exams = await Content.find({ date: threeDays, type: { $in: ["Prova","Avaliação"] }, "notifications.sentPoll": false });
      for (const exam of exams) {
        try {
          await sendExamPoll(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentPoll": true } });
          console.log(`[Scheduler] ✅ Enquete D-3: ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ Enquete:`, err.message); }
      }
    }

    // 5. Resumo semanal às 07:00 segundas
    if (time === "07:00" && getBRT().getDay() === 1) await sendWeeklySummary(today);

    // 6. Mensagens programadas (janela 5 min)
    const nowMin  = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const dueMsgs = await Message.find({ sent: false, date: { $lte: today } }).sort({ date: 1, time: 1 });
    for (const msg of dueMsgs) {
      const msgMin  = parseInt(msg.time.split(":")[0]) * 60 + parseInt(msg.time.split(":")[1]);
      const inWin   = msg.date === today && nowMin >= msgMin && nowMin <= msgMin + 5;
      const isPast  = msg.date < today;
      if (inWin || isPast) {
        try {
          const r = await sendScheduledMessage(msg);
          await Message.findByIdAndUpdate(msg._id, { $set: { sent: true } });
          console.log(`[Scheduler] ${r ? "✅" : "⚠️"} Mensagem: "${msg.title || msg.content.substring(0,30)}"`);
        } catch (err) { console.error(`[Scheduler] ❌ Msg:`, err.message); }
      }
    }
  } catch (err) { console.error("[Scheduler] ❌ Geral:", err.message); }
};

const sendWeeklySummary = async (today) => {
  try {
    const end = getBRT(); end.setDate(end.getDate() + 6);
    const contents = await Content.find({ date: { $gte: today, $lte: end.toISOString().split("T")[0] } }).sort({ date: 1 });
    if (!contents.length) return;
    const emoji = { Aula:"📖","Revisão":"🔄",Prova:"📝",Avaliação:"📊",Apresentação:"🎤",Atividade:"📋",Lista:"📃" };
    const lines = contents.map((c) => { const [y,m,d]=c.date.split("-"); return `${emoji[c.type]||"📚"} **${d}/${m}** ${c.time} — ${c.title} *(${c.subject})*`; }).join("\n");
    await sendDiscordNotification("agenda", "@here 📆 **Resumo semanal:**", {
      title:"📆 Resumo Semanal", description:lines, color:0x9B59B6,
      timestamp:new Date().toISOString(), footer:{text:`StudyHub v3.1.1 • ${contents.length} item(ns)`}
    });
  } catch (err) { console.error("[Scheduler] Erro resumo:", err.message); }
};

module.exports = { runScheduler };
