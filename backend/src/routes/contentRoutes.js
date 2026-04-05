// ============================================================
// StudyHub — routes/contentRoutes.js
// ============================================================

const express = require("express");
const router = express.Router();
const {
  getAllContents,
  getTodayContents,
  getUpcomingContents,
  getFutureExams,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
} = require("../controllers/contentController");

// Rotas especiais (antes das rotas com :id)
router.get("/today", getTodayContents);
router.get("/upcoming", getUpcomingContents);
router.get("/exams", getFutureExams);

// CRUD padrão
router.get("/", getAllContents);
router.get("/:id", getContentById);
router.post("/", createContent);
router.put("/:id", updateContent);
router.delete("/:id", deleteContent);

module.exports = router;
