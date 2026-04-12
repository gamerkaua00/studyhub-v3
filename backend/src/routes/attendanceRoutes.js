// StudyHub v3.1.1 — routes/attendanceRoutes.js — CORRIGIDO
const express    = require("express");
const router     = express.Router();
const Attendance = require("../models/Attendance");
const { requireAuth } = require("../middleware/auth");
const { sendAttendancePanel, sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const list = await Attendance.find({ active: true }).sort({ subject: 1 });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    // Gera nome do canal baseado na matéria
    const channelName = (req.body.subject || "")
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!channelName) {
      return res.status(400).json({ success: false, message: "Nome da matéria inválido" });
    }

    const attendance = new Attendance({ ...req.body, discordChannel: channelName });
    await attendance.save();
    console.log(`[Attendance] ✅ Criado: ${attendance.subject} → #${channelName}`);

    // Avisa no admin-bot
    await sendDiscordNotification("admin-bot", "", {
      title: "🏫 Novo Atendimento Cadastrado",
      description: `Matéria: **${req.body.subject}** | Professor: **${req.body.teacher}**\nCanal: **#${channelName}** (será criado no próximo restart do bot)`,
      color: 0x1ABC9C,
      timestamp: new Date().toISOString(),
    });

    // Tenta enviar painel (canal pode já existir)
    await sendAttendancePanel(attendance);

    res.status(201).json({ success: true, data: attendance });
  } catch (e) {
    console.error("[Attendance] Erro ao criar:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    // CRÍTICO: nunca sobrescreve discordChannel no update
    const updateData = { ...req.body };
    delete updateData.discordChannel; // canal não muda ao editar
    delete updateData._id;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    if (!attendance) return res.status(404).json({ success: false, message: "Atendimento não encontrado" });

    console.log(`[Attendance] ✅ Atualizado: ${attendance.subject}`);

    // Envia painel atualizado
    await sendAttendancePanel(attendance);

    res.json({ success: true, data: attendance });
  } catch (e) {
    console.error("[Attendance] Erro ao atualizar:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Attendance.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
