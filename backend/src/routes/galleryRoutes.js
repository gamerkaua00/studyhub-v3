// StudyHub v3 — routes/galleryRoutes.js — CORRIGIDO
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const Gallery = require("../models/Gallery");
const { requireAuth } = require("../middleware/auth");
const { uploadBuffer, deleteFile } = require("../services/cloudinaryService");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

const TYPE_EMOJI = { aula: "📖", prova: "📝", atividade: "📋", avaliacao: "📊", apresentacao: "🎤", lista: "📃", outro: "📁" };
const TYPE_LABEL = { aula: "Aula", prova: "Prova", atividade: "Atividade", avaliacao: "Avaliação", apresentacao: "Apresentação", lista: "Lista", outro: "Outro" };

router.get("/", async (req, res) => {
  try {
    const filter = req.query.subject ? { subject: req.query.subject } : {};
    const photos = await Gallery.find(filter).sort({ date: -1 });
    res.json({ success: true, data: photos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Nenhuma foto enviada" });
    const { subject, date, title, description, photoType = "aula" } = req.body;

    const safeName = `${subject}_${date}_${Date.now()}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");

    const folder = `studyhub/${subject.toLowerCase().replace(/\s+/g, "_")}`;
    const { url, publicId } = await uploadBuffer(req.file.buffer, folder, safeName);

    const photo = new Gallery({ subject, date, title, description, photoType, imageUrl: url, publicId });
    await photo.save();

    // Canal baseado na matéria
    const channelName = subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [y, m, d]   = date.split("-");
    const emoji       = TYPE_EMOJI[photoType] || "📷";
    const typeLabel   = TYPE_LABEL[photoType] || photoType;

    const embed = {
      title: `${emoji} ${subject} • ${d}/${m}/${y} — ${typeLabel}`,
      description: title || description || `Foto de ${typeLabel.toLowerCase()}`,
      color: 0x3498DB,
      image: { url },
      timestamp: new Date().toISOString(),
      footer: { text: `StudyHub • Galeria — ${typeLabel}` },
    };
    await sendDiscordNotification(channelName, "", embed);

    res.status(201).json({ success: true, data: photo });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false });
    await deleteFile(photo.publicId);
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
