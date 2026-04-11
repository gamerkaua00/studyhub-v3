// StudyHub v3 — routes/eventRoutes.js
const express = require("express");
const router  = express.Router();
const Event   = require("../models/Event");
const { requireAuth } = require("../middleware/auth");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {};
    if (month && year) {
      const m = String(month).padStart(2, "0");
      filter.date = { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-31` };
    }
    const events = await Event.find(filter).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();

    // Notifica Discord se solicitado
    if (event.notifyDiscord) {
      const [y, m, d] = event.date.split("-");
      await sendDiscordNotification(event.discordChannel || "agenda", "", {
        title: `${event.icon} ${event.title}`,
        description: event.description || "",
        color: parseInt((event.color || "#FEE75C").replace("#",""), 16),
        fields: [{ name: "📅 Data", value: `${d}/${m}/${y}${event.time ? ` às ${event.time}` : ""}`, inline: true }],
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub • Evento cadastrado" },
      });
    }

    res.status(201).json({ success: true, data: event });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: event });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
