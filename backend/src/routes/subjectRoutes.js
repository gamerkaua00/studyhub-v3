// StudyHub v3 — routes/subjectRoutes.js — COM AUTH
const express = require("express");
const router  = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getAllSubjects, createSubject, updateSubject, deleteSubject } = require("../controllers/subjectController");

router.use(requireAuth);
router.get("/",      getAllSubjects);
router.post("/",     createSubject);
router.put("/:id",   updateSubject);
router.delete("/:id",deleteSubject);

module.exports = router;
