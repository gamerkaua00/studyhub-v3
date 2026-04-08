// StudyHub v3 — services/scheduler.js — CORRIGIDO
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

// Horário de Brasília (UTC-3)
const getBRT = () => {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
};

const getTodayBRT    = () => getBRT().toISOString().split("T")[0];
const getTimeBRT     = () => getBRT().toISOString().split("T")[1].substring(0, 5);
const getDateFromNow = (days) => {
  const brt = getBRT();
  brt.setDate(brt.getDate() + days);
  return brt.toISOString().split("T")[0];
};

const runScheduler = async () => {
  try {
    const today    = getTodayBRT();
    const time     = getTimeBRT();
    const tomorrow = getDateFromNow(1);
    const threeDays = getDateFromNow(3);

    // 1. Notificações principais: conteúdos no horário exato
    const dueContents = await Content.find({ date: today, time, "notifications.sentMain": false });
    for (const c of dueContents) {
      try {
        await sendMainNotification(c);
        await Content.findByIdAndUpdate(c._id, { $set: { "notifications.sentMain": true } });
        console.log(`[Scheduler] ✅ Notificação enviada: ${c.title}`);
      } catch (err) {
        console.error(`[Scheduler] ❌ Erro ao notificar ${c.title}:`, err.message);
      }
    }

    // 2. Aviso 1 dia antes — verificado a cada minuto, enviado às 08:00
    if (time === "08:00") {
      const tomorrowExams = await Content.find({
        date: tomorrow,
        type: { $in: ["Prova", "Avaliação"] },
        "notifications.sentDayBefore": false,
      });
      for (const exam of tomorrowExams) {
        try {
          await sendDayBeforeNotification(exam);
          await Content.findByIdAndUpdate(exam._id, { $set: { "notifications.sentDayBefore": true } });
          console.log(`[Scheduler] ✅ Aviso D-1: ${exam.title}`);
        } catch (err) {
          console.error(`[Scheduler] ❌ Erro aviso D-1 ${exam.title}:`, err.message);
        }
      }
    }

    // 3. Enquete 3 dias antes — às 19:00
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
        } catch (err) {
          console.error(`[Scheduler] ❌ Erro enquete ${exam.title}:`, err.message);
        }
      }
    }

    // 4. Resumo semanal — segundas às 07:00
    if (time === "07:00" && getBRT().getDay() === 1) {
      await sendWeeklySummary(today);
    }

    // 5. Mensagens programadas pelo admin — CORRIGIDO
    // Busca mensagens não enviadas com data e hora exatos OU atrasadas (até 5 min)
    const brtNow    = getBRT();
    const fiveAgo   = new Date(brtNow.getTime() - 5 * 60 * 1000);
    const fiveAgoDate = fiveAgo.toISOString().split("T")[0];
    const fiveAgoTime = fiveAgo.toISOString().split("T")[1].substring(0, 5);

    // Busca mensagens pendentes dos últimos 5 minutos (tolerância de atraso)
    const dueMessages = await Message.find({ sent: false }).sort({ date: 1, time: 1 });

    for (const msg of dueMessages) {
      // Compara data e hora: deve ser <= agora e >= 5 minutos atrás
      const msgDateTime = msg.date + "T" + msg.time;
      const nowDateTime = today + "T" + time;
      const fiveAgoDateTime = fiveAgoDate + "T" + fiveAgoTime;

      if (msgDateTime <= nowDateTime && msgDateTime >= fiveAgoDateTime) {
        try {
          const result = await sendScheduledMessage(msg);
          if (result) {
            await Message.findByIdAndUpdate(msg._id, { $set: { sent: true } });
            console.log(`[Scheduler] ✅ Mensagem enviada: "${msg.title || msg.content.substring(0, 30)}"`);
          } else {
            console.error(`[Scheduler] ❌ Falha ao enviar mensagem (canal não encontrado?): ${msg.discordChannel}`);
          }
        } catch (err) {
          console.error(`[Scheduler] ❌ Erro ao enviar mensagem programada:`, err.message);
        }
      }
    }

  } catch (err) {
    console.error("[Scheduler] ❌ Erro geral:", err.message);
  }
};

const sendWeeklySummary = async (today) => {
  try {
    const endOfWeek = getBRT();
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const endStr   = endOfWeek.toISOString().split("T")[0];
    const contents = await Content.find({ date: { $gte: today, $lte: endStr } }).sort({ date: 1 });
    if (!contents.length) return;

    const typeEmoji = { Aula: "📖", "Revisão": "🔄", Prova: "📝", Avaliação: "📊", Apresentação: "🎤", Atividade: "📋", Lista: "📃" };
    const lines = contents.map((c) => {
      const [y, m, d] = c.date.split("-");
      return `${typeEmoji[c.type] || "📚"} **${d}/${m}** ${c.time} — ${c.title} *(${c.subject})*`;
    }).join("\n");

    await sendDiscordNotification("agenda", "@here 📆 **Resumo da semana:**", {
      title: "📆 Resumo Semanal",
      description: lines,
      color: 0x9B59B6,
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub • ${contents.length} item(ns) esta semana` },
    });
  } catch (err) {
    console.error("[Scheduler] Erro resumo semanal:", err.message);
  }
};

module.exports = { runScheduler };
