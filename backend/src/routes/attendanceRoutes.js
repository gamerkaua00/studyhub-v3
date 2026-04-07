// StudyHub v3 — routes/attendanceRoutes.js
const express    = require("express");
const router     = express.Router();
const Attendance = require("../models/Attendance");
const { requireAuth } = require("../middleware/auth");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

// Envia/atualiza painel de atendimento no canal correto
const sendAttendancePanel = async (attendance) => {
  const channelName = attendance.discordChannel;
  if (!channelName) return;
  const days = attendance.days?.join(", ") || "A definir";
  const embed = {
    title: `📋 Horário de Atendimento — ${attendance.subject}`,
    description: "Horários disponíveis para atendimento desta matéria.",
    color: 0x1ABC9C,
    fields: [
      { name: "👨‍🏫 Professor", value: attendance.teacher,                    inline: true  },
      { name: "🏫 Sala",      value: attendance.room || "A definir",          inline: true  },
      { name: "📅 Dias",      value: days || "A definir",                     inline: false },
      { name: "🕐 Horário",   value: `${attendance.startTime} — ${attendance.endTime}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "StudyHub • Painel de Atendimento — atualizado automaticamente" },
  };
  if (attendance.notes) embed.fields.push({ name: "📝 Observações", value: attendance.notes, inline: false });
  await sendDiscordNotification(channelName, "", embed);
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
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const attendance = new Attendance({ ...req.body, discordChannel: channelName });
    await attendance.save();

    // Avisa no #admin-bot para o bot criar o canal
    await sendDiscordNotification("admin-bot", "", {
      title: "🏫 Novo Canal de Atendimento",
      description: `Canal **#${channelName}** precisa ser criado na categoria **🏫 Atendimento**.\nMatéria: **${req.body.subject}** | Professor: **${req.body.teacher}**`,
      color: 0x1ABC9C,
      timestamp: new Date().toISOString(),
      footer: { text: "StudyHub • O bot criará o canal automaticamente no próximo reinício" },
    });

    // Tenta enviar o painel no canal (se já existir)
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
