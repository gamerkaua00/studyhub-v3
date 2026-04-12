// StudyHub v3.1.1 — routes/statsRoutes.js
const express = require("express");
const router  = express.Router();
const Content = require("../models/Content");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/overview", async (req, res) => {
  try {
    const { month, year } = req.query;
    const now  = new Date();
    const m    = month || (now.getMonth() + 1);
    const y    = year  || now.getFullYear();
    const mStr = String(m).padStart(2, "0");

    const [monthContents, allFuture] = await Promise.all([
      Content.find({ date: { $gte: `${y}-${mStr}-01`, $lte: `${y}-${mStr}-31` } }),
      Content.find({ date: { $gte: new Date().toISOString().split("T")[0] } }),
    ]);

    // Por tipo
    const byType = {};
    for (const c of monthContents) { byType[c.type] = (byType[c.type] || 0) + 1; }

    // Por matéria
    const bySubject = {};
    for (const c of monthContents) { bySubject[c.subject] = (bySubject[c.subject] || 0) + 1; }

    // Notificações enviadas
    const sentCount = monthContents.filter((c) => c.notifications?.sentMain).length;

    // Próximas provas
    const upcomingExams = allFuture
      .filter((c) => c.type === "Prova" || c.type === "Avaliação")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((c) => {
        const today = new Date().toISOString().split("T")[0];
        const days  = Math.round((new Date(c.date + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000);
        return { ...c.toObject(), daysUntil: days };
      });

    res.json({
      success: true,
      data: {
        total: monthContents.length,
        byType,
        bySubject,
        sentNotifications: sentCount,
        upcomingExams,
        month: m, year: y,
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
