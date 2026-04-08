// StudyHub v3 — scheduler.js — CORRIGIDO com catch-up de notificações perdidas
require("dotenv").config();
const Content = require("../models/Content");
const Message = require("../models/Message");
const {
  sendMainNotification,
  sendDayBeforeNotification,
  sendExamPoll,
  sendScheduledMessage,
  sendMonthlyAgenda,
  sendDiscordNotification,
} = require("./discordNotifier");

const getBRT = () => new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
const getTodayBRT    = () => getBRT().toISOString().split("T")[0];
const getTimeBRT     = () => getBRT().toISOString().split("T")[1].substring(0, 5);
const getDateFromNow = (days) => {
  const brt = getBRT();
  brt.setDate(brt.getDate() + days);
  return brt.toISOString().split("T")[0];
};

const runScheduler = async () => {
  try {
    const today     = getTodayBRT();
    const time      = getTimeBRT();
    const tomorrow  = getDateFromNow(1);
    const threeDays = getDateFromNow(3);
    const yesterday = getDateFromNow(-1);

    // ── 1. Notificações no horário exato ────────────────────
    const dueContents = await Content.find({
      date: today,
      time,
      "notifications.sentMain": false,
    });
    for (const c of dueContents) {
      try {
        await sendMainNotification(c);
        await Content.findByIdAndUpdate(c._id, { $set: { "notifications.sentMain": true } });
        console.log(`[Scheduler] ✅ Notificação: ${c.title}`);
      } catch (err) { console.error(`[Scheduler] ❌ Erro notif ${c.title}:`, err.message); }
    }

    // ── 2. Aviso D-1: provas de amanhã ───────────────────────
    // Verifica em qualquer horário (catch-up para o Render que pode ter dormido às 08:00)
    const tomorrowExams = await Content.find({
      date: tomorrow,
      type: { $in: ["Prova", "Avaliação"] },
      "notifications.sentDayBefore": false,
    });
    if (tomorrowExams.length > 0) {
      for (const exam of tomorrowExams) {
        try {
          await sendDayBeforeNotification(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
          console.log(`[Scheduler] ✅ Aviso D-1: ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ Erro D-1 ${exam.title}:`, err.message); }
      }
    }

    // CATCH-UP: prova era hoje mas D-1 não foi enviado ontem
    const missedDayBefore = await Content.find({
      date: today,
      type: { $in: ["Prova", "Avaliação"] },
      "notifications.sentDayBefore": false,
      "notifications.sentMain": false, // ainda não aconteceu
    });
    for (const exam of missedDayBefore) {
      // Só envia catch-up se o horário da prova ainda não passou
      if (exam.time > time) {
        try {
          await sendDayBeforeNotification(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
          console.log(`[Scheduler] ✅ Catch-up D-1: ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ Erro catch-up:`, err.message); }
      }
    }

    // ── 3. Enquete D-3 às 19:00 ──────────────────────────────
    if (time === "19:00") {
      const upcomingExams = await Content.find({
        date: threeDays,
        type: { $in: ["Prova", "Avaliação"] },
        "notifications.sentPoll": false,
      });
      for (const exam of upcomingExams) {
        try {
          await sendExamPoll(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentPoll": true } });
          console.log(`[Scheduler] ✅ Enquete D-3: ${exam.title}`);
        } catch (err) { console.error(`[Scheduler] ❌ Erro enquete:`, err.message); }
      }
    }

    // ── 4. Resumo semanal às 07:00 segundas ──────────────────
    if (time === "07:00" && getBRT().getDay() === 1) {
      await sendWeeklySummary(today);
    }

    // ── 5. Mensagens programadas (com janela de 5 min) ───────
    const nowMinutes  = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const dueMessages = await Message.find({ sent: false, date: { $lte: today } }).sort({ date: 1, time: 1 });

    for (const msg of dueMessages) {
      const msgMinutes = parseInt(msg.time.split(":")[0]) * 60 + parseInt(msg.time.split(":")[1]);
      const isToday    = msg.date === today;
      const isPast     = msg.date < today;
      const inWindow   = isToday && nowMinutes >= msgMinutes && nowMinutes <= msgMinutes + 5;

      if (inWindow || isPast) {
        try {
          const result = await sendScheduledMessage(msg);
          if (result) {
            await Message.findByIdAndUpdate(msg._id, { $set: { sent: true } });
            console.log(`[Scheduler] ✅ Mensagem: "${msg.title || msg.content.substring(0, 30)}"`);
          } else {
            console.error(`[Scheduler] ❌ Canal não encontrado: "${msg.discordChannel}"`);
            // Marca como enviada mesmo assim para não ficar tentando para sempre
            if (isPast) await Message.findByIdAndUpdate(msg._id, { $set: { sent: true, failed: true } });
          }
        } catch (err) { console.error(`[Scheduler] ❌ Erro mensagem:`, err.message); }
      }
    }

  } catch (err) {
    console.error("[Scheduler] ❌ Erro geral:", err.message);
  }
};

const sendWeeklySummary = async (today) => {
  try {
    const endBRT = getBRT();
    endBRT.setDate(endBRT.getDate() + 6);
    const endStr   = endBRT.toISOString().split("T")[0];
    const contents = await Content.find({ date: { $gte: today, $lte: endStr } }).sort({ date: 1 });
    if (!contents.length) return;
    const typeEmoji = { Aula:"📖","Revisão":"🔄",Prova:"📝",Avaliação:"📊",Apresentação:"🎤",Atividade:"📋",Lista:"📃" };
    const lines = contents.map((c) => {
      const [y,m,d] = c.date.split("-");
      return `${typeEmoji[c.type]||"📚"} **${d}/${m}** ${c.time} — ${c.title} *(${c.subject})*`;
    }).join("\n");
    await sendDiscordNotification("agenda", "@here 📆 **Resumo da semana:**", {
      title: "📆 Resumo Semanal", description: lines, color: 0x9B59B6,
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub • ${contents.length} item(ns) esta semana` },
    });
  } catch (err) { console.error("[Scheduler] Erro resumo:", err.message); }
};

module.exports = { runScheduler };
