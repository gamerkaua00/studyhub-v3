// StudyHub v3 — routes/attendanceRoutes.js
const express    = require("express");
const router     = express.Router();
const Attendance = require("../models/Attendance");
const { requireAuth } = require("../middleware/auth");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

const sendAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) return;

  // Monta campos de horários (suporte a múltiplos)
  const schedules = attendance.schedules?.length > 0
    ? attendance.schedules
    : [{ days: attendance.days || [], startTime: attendance.startTime, endTime: attendance.endTime, room: attendance.room, notes: attendance.notes }];

  const scheduleFields = schedules.map((s, i) => {
    const days = s.days?.join(", ") || "A definir";
    const label = schedules.length > 1 ? `📅 Horário ${i + 1}` : "📅 Horário";
    return { name: label, value: `**${days}** — ${s.startTime} às ${s.endTime}${s.room ? `\n🏫 ${s.room}` : ""}${s.notes ? `\n📝 ${s.notes}` : ""}`, inline: schedules.length > 1 };
  });

  const embed = {
    title: `📋 Horário de Atendimento — ${attendance.subject}`,
    description: "Horários disponíveis para atendimento desta matéria.",
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher, inline: false },
      ...scheduleFields,
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Painel de Atendimento — atualizado automaticamente" },
  };

  return sendDiscordNotification(channelName, "", embed);
};

router.get("/", async (req, res) => {
  try {
    const list = await Attendance.find({ active: true }).sort({ subject: 1 });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const channelName = req.body.subject
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const attendance = new Attendance({ ...req.body, discordChannel: channelName });
    await attendance.save();

    // Notifica admin-bot que precisa criar o canal
    await sendDiscordNotification("admin-bot", "", {
      title: "🏫 Novo Canal de Atendimento Solicitado",
      description: `Canal **#${channelName}** será criado.\nMatéria: **${req.body.subject}** | Professor: **${req.body.teacher}**`,
      color: 0x1ABC9C,
      timestamp: new Date().toISOString(),
      footer: { text: "StudyHub • O canal será criado ao reinicar o bot ou via /reenviar-agenda" },
    });

    // Tenta enviar painel (se canal já existir)
    await sendAttendancePanel(attendance);

    res.status(201).json({ success: true, data: attendance });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!attendance) return res.status(404).json({ success: false, message: "Não encontrado" });
    await sendAttendancePanel(attendance);
    res.json({ success: true, data: attendance });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Attendance.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
