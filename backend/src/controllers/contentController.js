// StudyHub v3 — controllers/contentController.js — CORRIGIDO
const Content  = require("../models/Content");
const Subject  = require("../models/Subject");
const { sendMonthlyAgenda, sendDiscordNotification } = require("../services/discordNotifier");

const getBRT = () => new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

// Mapeia tipo para canal padrão no Discord
const TYPE_CHANNEL_MAP = {
  "Aula":         "conteudos",
  "Revisão":      "conteudos",
  "Prova":        "avisos-provas",
  "Apresentação": "apresentacoes",
  "Atividade":    "atividades",
  "Avaliação":    "avaliacoes",
  "Lista":        "listas",
};

const TYPE_EMOJI = {
  "Aula":         "📖",
  "Revisão":      "🔄",
  "Prova":        "📝",
  "Apresentação": "🎤",
  "Atividade":    "📋",
  "Avaliação":    "📊",
  "Lista":        "📃",
};

// Envia notificação imediata do conteúdo criado/editado
const notifyContentCreated = async (content, isEdit = false) => {
  try {
    const channel = content.discordChannel || TYPE_CHANNEL_MAP[content.type] || "conteudos";
    const emoji   = TYPE_EMOJI[content.type] || "📚";
    const [y, m, d] = content.date.split("-");

    const embed = {
      title: `${emoji} ${isEdit ? "✏️ Atualizado:" : "📌 Novo:"} ${content.title}`,
      color: parseInt((content.subjectColor || "#5865F2").replace("#", ""), 16),
      fields: [
        { name: "📌 Matéria", value: content.subject,      inline: true },
        { name: "🏷️ Tipo",    value: content.type,         inline: true },
        { name: "📅 Data",    value: `${d}/${m}/${y}`,     inline: true },
        { name: "🕐 Horário", value: content.time,         inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "StudyHub • Conteúdo cadastrado no sistema" },
    };
    if (content.description) embed.description = content.description;
    if (content.resourceLink) embed.fields.push({ name: "🔗 Material", value: `[Acessar](${content.resourceLink})`, inline: false });

    await sendDiscordNotification(channel, "", embed);

    // Também reenvia a agenda completa do mês no #agenda
    const month    = parseInt(m);
    const year     = parseInt(y);
    const contents = await Content.find({
      date: { $gte: `${year}-${String(month).padStart(2,"0")}-01`, $lte: `${year}-${String(month).padStart(2,"0")}-31` }
    }).sort({ date: 1, time: 1 });

    if (contents.length > 0) {
      await sendMonthlyAgenda(contents, month, year);
    }
  } catch (err) {
    console.error("[Content] Erro ao notificar Discord:", err.message);
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
    const today = getBRT().toISOString().split("T")[0];
    const contents = await Content.find({ date: today }).sort({ time: 1 });
    res.json({ success: true, data: contents, date: today });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getUpcomingContents = async (req, res) => {
  try {
    const today = getBRT().toISOString().split("T")[0];
    const limit = parseInt(req.query.limit) || 10;
    const contents = await Content.find({ date: { $gte: today } }).sort({ date: 1, time: 1 }).limit(limit);
    res.json({ success: true, data: contents });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getFutureExams = async (req, res) => {
  try {
    const today = getBRT().toISOString().split("T")[0];
    const exams = await Content.find({ type: { $in: ["Prova", "Avaliação"] }, date: { $gte: today } }).sort({ date: 1 });
    res.json({ success: true, data: exams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Não encontrado" });
    res.json({ success: true, data: content });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createContent = async (req, res) => {
  try {
    const { title, subject, type, date, time, discordChannel, resourceLink, description } = req.body;
    let subjectColor = "#5865F2";
    const existingSubject = await Subject.findOne({ name: subject });
    if (existingSubject) subjectColor = existingSubject.color;

    // Se não especificou canal, usa o padrão pelo tipo
    const channel = discordChannel || TYPE_CHANNEL_MAP[type] || "conteudos";

    const content = new Content({ title, subject, subjectColor, type, date, time,
      discordChannel: channel, resourceLink: resourceLink || "", description: description || "" });
    await content.save();

    // Notifica Discord imediatamente
    await notifyContentCreated(content, false);

    res.status(201).json({ success: true, data: content, message: "Conteúdo criado!" });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(", ") });
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
      updates["notifications.sentPoll"]      = false;
    }
    const content = await Content.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!content) return res.status(404).json({ success: false, message: "Não encontrado" });

    await notifyContentCreated(content, true);

    res.json({ success: true, data: content, message: "Atualizado!" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Não encontrado" });

    // Atualiza agenda após deletar
    const [y, m] = content.date.split("-").map(Number);
    const remaining = await Content.find({
      date: { $gte: `${y}-${String(m).padStart(2,"0")}-01`, $lte: `${y}-${String(m).padStart(2,"0")}-31` }
    }).sort({ date: 1, time: 1 });
    if (remaining.length > 0) await sendMonthlyAgenda(remaining, m, y);

    res.json({ success: true, message: "Excluído!" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAllContents, getTodayContents, getUpcomingContents, getFutureExams, getContentById, createContent, updateContent, deleteContent };
