// ============================================================
// StudyHub v3 — routes/messageRoutes.js
// ============================================================
const express = require("express");
const router  = express.Router();
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ date: 1, time: 1 });
    res.json({ success: true, data: msgs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.status(201).json({ success: true, data: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
