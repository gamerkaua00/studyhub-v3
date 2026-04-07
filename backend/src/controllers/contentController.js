// StudyHub v3 — controllers/contentController.js
const Content  = require("../models/Content");
const Subject  = require("../models/Subject");
const { sendMonthlyAgenda } = require("../services/discordNotifier");

const getBRT = () => {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
};

// Envia agenda atualizada do mês no Discord após criar/editar conteúdo
const refreshAgenda = async (date) => {
  try {
    const [year, month] = date.split("-").map(Number);
    const contents = await Content.find({
      date: { $gte: `${year}-${String(month).padStart(2,"0")}-01`, $lte: `${year}-${String(month).padStart(2,"0")}-31` }
    }).sort({ date: 1, time: 1 });
    await sendMonthlyAgenda(contents, month, year);
  } catch (err) {
    console.error("[Content] Erro ao atualizar agenda no Discord:", err.message);
  }
};

const getAllContents = async (req, res) => {
  try {
    const { month, year, subject, type } = req.query;
    const filter = {};
    if (month && year) {
      const m = String(month).padStart(2, "0");
      filter.date = { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-31` };
    }
    if (subject) filter.subject = subject;
    if (type)    filter.type    = type;
    const contents = await Content.find(filter).sort({ date: 1, time: 1 });
    res.json({ success: true, data: contents });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getTodayContents = async (req, res) => {
  try {
    const today    = getBRT().toISOString().split("T")[0];
    const contents = await Content.find({ date: today }).sort({ time: 1 });
    res.json({ success: true, data: contents, date: today });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getUpcomingContents = async (req, res) => {
  try {
    const today   = getBRT().toISOString().split("T")[0];
    const limit   = parseInt(req.query.limit) || 10;
    const contents = await Content.find({ date: { $gte: today } }).sort({ date: 1, time: 1 }).limit(limit);
    res.json({ success: true, data: contents });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getFutureExams = async (req, res) => {
  try {
    const today = getBRT().toISOString().split("T")[0];
    const exams = await Content.find({ type: "Prova", date: { $gte: today } }).sort({ date: 1 });
    res.json({ success: true, data: exams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    res.json({ success: true, data: content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createContent = async (req, res) => {
  try {
    const { title, subject, type, date, time, discordChannel, resourceLink, description } = req.body;
    let subjectColor = "#5865F2";
    const existingSubject = await Subject.findOne({ name: subject });
    if (existingSubject) subjectColor = existingSubject.color;

    const content = new Content({ title, subject, subjectColor, type, date, time, discordChannel, resourceLink: resourceLink || "", description: description || "" });
    await content.save();

    // Notifica o Discord com a agenda atualizada do mês
    await refreshAgenda(date);

    res.status(201).json({ success: true, data: content, message: "Conteúdo criado com sucesso" });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateContent = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.subject) {
      const s = await Subject.findOne({ name: updates.subject });
      if (s) updates.subjectColor = s.color;
    }
    if (updates.date || updates.time) {
      updates["notifications.sentMain"]      = false;
      updates["notifications.sentDayBefore"] = false;
    }
    const content = await Content.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!content) return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });

    // Notifica agenda atualizada
    await refreshAgenda(content.date);

    res.json({ success: true, data: content, message: "Conteúdo atualizado com sucesso" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });

    // Atualiza agenda no Discord após deletar
    await refreshAgenda(content.date);

    res.json({ success: true, message: "Conteúdo excluído com sucesso" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAllContents, getTodayContents, getUpcomingContents, getFutureExams, getContentById, createContent, updateContent, deleteContent };
