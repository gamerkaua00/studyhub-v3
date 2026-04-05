// ============================================================
// StudyHub v3 — routes/attendanceRoutes.js
// Ao criar um atendimento, avisa o bot para criar o canal
// ============================================================
const express    = require("express");
const router     = express.Router();
const Attendance = require("../models/Attendance");
const { requireAuth } = require("../middleware/auth");
const { notifyBotCreateChannel, updateAttendancePanel } = require("../services/discordNotifier");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const list = await Attendance.find({ active: true }).sort({ subject: 1 });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    // Nome do canal baseado na matéria (sem acentos, minúsculo)
    const channelName = req.body.subject
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const attendance = new Attendance({ ...req.body, discordChannel: channelName });
    await attendance.save();

    // Notifica o bot para criar o canal de atendimento
    await notifyBotCreateChannel(channelName, attendance);

    res.status(201).json({ success: true, data: attendance });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    // Atualiza o painel no Discord
    await updateAttendancePanel(attendance);
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
