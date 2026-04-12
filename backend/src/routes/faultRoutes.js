// StudyHub v3.1.2 — routes/faultRoutes.js — controle de faltas
const express = require("express");
const router  = express.Router();
const Fault   = require("../models/Fault");
const { requireAuth } = require("../middleware/auth");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

const LIMIT = 20; // limite de faltas por matéria

router.get("/", async (req, res) => {
  try {
    const { student, subject } = req.query;
    const filter = {};
    if (student) filter.studentName = { $regex: new RegExp(student, "i") };
    if (subject) filter.subject     = { $regex: new RegExp(subject, "i") };
    const faults = await Fault.find(filter).sort({ date: -1 });
    res.json({ success: true, data: faults });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Resumo de faltas por aluno/matéria
router.get("/summary", async (req, res) => {
  try {
    const summary = await Fault.aggregate([
      { $group: { _id: { student: "$studentName", subject: "$subject" }, total: { $sum: 1 }, justified: { $sum: { $cond: ["$justified", 1, 0] } } } },
      { $sort: { "_id.student": 1, "_id.subject": 1 } },
    ]);
    const data = summary.map((s) => ({
      student:   s._id.student,
      subject:   s._id.subject,
      total:     s.total,
      justified: s.justified,
      unexcused: s.total - s.justified,
      atLimit:   (s.total - s.justified) >= LIMIT,
      pct:       Math.round(((s.total - s.justified) / LIMIT) * 100),
    }));
    res.json({ success: true, data, limit: LIMIT });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { studentName, subject, date, note, justified } = req.body;
    if (!studentName || !subject || !date) return res.status(400).json({ success: false, message: "Campos obrigatórios" });

    const fault = new Fault({ studentName, subject, date, note: note || "", justified: justified || false });
    await fault.save();

    // Conta faltas injustificadas
    const count = await Fault.countDocuments({ studentName, subject, justified: false });
    let warnMsg = "";
    if (count === 15) warnMsg = `⚠️ **${studentName}** atingiu **15 faltas** em **${subject}** (limite: ${LIMIT})`;
    if (count === 18) warnMsg = `🔴 **${studentName}** tem **18 faltas** em **${subject}** — risco de reprovação!`;
    if (count >= LIMIT) warnMsg = `🚨 **${studentName}** atingiu o **limite de ${LIMIT} faltas** em **${subject}**!`;

    if (warnMsg) {
      await sendDiscordNotification("admin-bot", warnMsg, {
        title: "📊 Alerta de Faltas",
        description: warnMsg,
        color: count >= LIMIT ? 0xED4245 : 0xFEE75C,
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3.1.2 • Controle de Faltas" },
      });
    }

    res.status(201).json({ success: true, data: fault, totalFaults: count, warning: warnMsg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const fault = await Fault.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: fault });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Fault.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
