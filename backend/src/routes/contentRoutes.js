// StudyHub v3 — routes/contentRoutes.js — COM AUTH
const express = require("express");
const router  = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getAllContents, getTodayContents, getUpcomingContents,
  getFutureExams, getContentById, createContent, updateContent, deleteContent,
} = require("../controllers/contentController");

router.use(requireAuth);

router.get("/today",    getTodayContents);
router.get("/upcoming", getUpcomingContents);
router.get("/exams",    getFutureExams);
router.get("/",         getAllContents);
router.get("/:id",      getContentById);
router.post("/",        createContent);
router.put("/:id",      updateContent);
router.delete("/:id",   deleteContent);

module.exports = router;
