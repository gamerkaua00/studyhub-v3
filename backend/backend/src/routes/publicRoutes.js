// StudyHub v3 — routes/publicRoutes.js
const express = require("express");
const router  = express.Router();
const Content = require("../models/Content");

const getBRT = () => {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
};

router.get("/today", async (req, res) => {
  try {
    const today = getBRT().toISOString().split("T")[0];
    const contents = await Content.find({ date: today }).select("title subject subjectColor type date time description").sort({ time: 1 });
    res.json({ success: true, data: contents, date: today });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/agenda", async (req, res) => {
  try {
    const { month, year, limit } = req.query;
    const today = getBRT().toISOString().split("T")[0];
    let filter = { date: { $gte: today } };
    if (month && year) {
      const m = String(month).padStart(2, "0");
      filter = { date: { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-31` } };
    }
    let query = Content.find(filter).select("title subject subjectColor type date time description").sort({ date: 1, time: 1 });
    if (limit) query = query.limit(parseInt(limit));
    const contents = await query;
    res.json({ success: true, data: contents });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/exams", async (req, res) => {
  try {
    const today = getBRT().toISOString().split("T")[0];
    const exams = await Content.find({ type: "Prova", date: { $gte: today } }).select("title subject subjectColor type date time").sort({ date: 1 });
    res.json({ success: true, data: exams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
