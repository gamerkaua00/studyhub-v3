// ============================================================
// StudyHub — controllers/contentController.js
// CRUD completo de conteúdos de estudo
// ============================================================

const Content = require("../models/Content");
const Subject = require("../models/Subject");

// ── Listar todos os conteúdos ────────────────────────────────
const getAllContents = async (req, res) => {
  try {
    const { month, year, subject, type } = req.query;
    const filter = {};

    // Filtro por mês/ano (para o calendário)
    if (month && year) {
      const paddedMonth = String(month).padStart(2, "0");
      filter.date = {
        $gte: `${year}-${paddedMonth}-01`,
        $lte: `${year}-${paddedMonth}-31`,
      };
    }

    if (subject) filter.subject = subject;
    if (type) filter.type = type;

    const contents = await Content.find(filter).sort({ date: 1, time: 1 });
    res.json({ success: true, data: contents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Conteúdos de hoje ────────────────────────────────────────
const getTodayContents = async (req, res) => {
  try {
    // Usa o fuso de Brasília: UTC-3
    const now = new Date();
    const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = brt.toISOString().split("T")[0];

    const contents = await Content.find({ date: today }).sort({ time: 1 });
    res.json({ success: true, data: contents, date: today });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Próximos conteúdos (a partir de hoje) ───────────────────
const getUpcomingContents = async (req, res) => {
  try {
    const now = new Date();
    const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = brt.toISOString().split("T")[0];
    const limit = parseInt(req.query.limit) || 10;

    const contents = await Content.find({ date: { $gte: today } })
      .sort({ date: 1, time: 1 })
      .limit(limit);

    res.json({ success: true, data: contents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Provas futuras ───────────────────────────────────────────
const getFutureExams = async (req, res) => {
  try {
    const now = new Date();
    const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = brt.toISOString().split("T")[0];

    const exams = await Content.find({
      type: "Prova",
      date: { $gte: today },
    }).sort({ date: 1 });

    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Buscar conteúdo por ID ───────────────────────────────────
const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    }
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Criar novo conteúdo ──────────────────────────────────────
const createContent = async (req, res) => {
  try {
    const { title, subject, type, date, time, discordChannel, resourceLink, description } = req.body;

    // Busca a cor da matéria se ela já estiver cadastrada
    let subjectColor = "#5865F2";
    const existingSubject = await Subject.findOne({ name: subject });
    if (existingSubject) {
      subjectColor = existingSubject.color;
    }

    const content = new Content({
      title,
      subject,
      subjectColor,
      type,
      date,
      time,
      discordChannel,
      resourceLink: resourceLink || "",
      description: description || "",
    });

    await content.save();
    res.status(201).json({ success: true, data: content, message: "Conteúdo criado com sucesso" });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Atualizar conteúdo ───────────────────────────────────────
const updateContent = async (req, res) => {
  try {
    const updates = req.body;

    // Se mudar a matéria, atualiza a cor automaticamente
    if (updates.subject) {
      const existingSubject = await Subject.findOne({ name: updates.subject });
      if (existingSubject) {
        updates.subjectColor = existingSubject.color;
      }
    }

    // Reseta flags de notificação se a data ou horário mudarem
    if (updates.date || updates.time) {
      updates["notifications.sentMain"] = false;
      updates["notifications.sentDayBefore"] = false;
    }

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    }

    res.json({ success: true, data: content, message: "Conteúdo atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Excluir conteúdo ─────────────────────────────────────────
const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    }
    res.json({ success: true, message: "Conteúdo excluído com sucesso" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllContents,
  getTodayContents,
  getUpcomingContents,
  getFutureExams,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
};
