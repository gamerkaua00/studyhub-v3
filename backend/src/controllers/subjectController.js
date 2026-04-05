// ============================================================
// StudyHub — controllers/subjectController.js
// CRUD de matérias com cores
// ============================================================

const Subject = require("../models/Subject");
const Content = require("../models/Content");

const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, color, emoji } = req.body;
    const subject = new Subject({ name, color, emoji });
    await subject.save();

    // Atualiza a cor em todos os conteúdos desta matéria
    await Content.updateMany({ subject: name }, { $set: { subjectColor: color } });

    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Matéria já cadastrada" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { color, emoji } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: { color, emoji } },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, message: "Matéria não encontrada" });
    }

    // Propaga a nova cor para todos os conteúdos desta matéria
    await Content.updateMany({ subject: subject.name }, { $set: { subjectColor: color } });

    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Matéria não encontrada" });
    }
    res.json({ success: true, message: "Matéria excluída" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllSubjects, createSubject, updateSubject, deleteSubject };
