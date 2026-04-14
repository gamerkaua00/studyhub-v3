// StudyHub v3.2.0 — routes/webhookRoutes.js
const express = require("express");
const router  = express.Router();
const Webhook = require("../models/Webhook");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const hooks = await Webhook.find().sort({ channelName: 1 });
    res.json({ success: true, data: hooks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, channelName, url } = req.body;
    if (!channelName || !url) return res.status(400).json({ success: false, message: "Canal e URL obrigatórios" });
    if (!url.includes("discord.com/api/webhooks")) return res.status(400).json({ success: false, message: "URL deve ser um webhook do Discord" });
    const hook = new Webhook({ name: name || channelName, channelName: channelName.toLowerCase(), url });
    await hook.save();
    // Invalida cache
    const { loadWebhooks } = require("../services/webhookService");
    const wsMod = require("../services/webhookService");
    wsMod.lastCacheTime = 0;
    res.status(201).json({ success: true, data: hook });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const hook = await Webhook.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: hook });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Webhook.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
