// ============================================================
// StudyHub v3 — routes/galleryRoutes.js
// Upload de fotos via Cloudinary, envia no Discord
// ============================================================
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const Gallery = require("../models/Gallery");
const { requireAuth } = require("../middleware/auth");
const { uploadBuffer, deleteFile } = require("../services/cloudinaryService");
const { sendGalleryPhoto } = require("../services/discordNotifier");

router.use(requireAuth);

// Multer em memória — não salva no disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

router.get("/", async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject ? { subject } : {};
    const photos = await Gallery.find(filter).sort({ date: -1 });
    res.json({ success: true, data: photos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Nenhuma foto enviada" });

    const { subject, date, title, description } = req.body;

    // Formata nome do arquivo: materia_data_titulo
    const safeName = `${subject}_${date}_${Date.now()}`
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "");

    const folder = `studyhub/${subject.toLowerCase().replace(/\s+/g, "_")}`;

    // Upload para Cloudinary
    const { url, publicId } = await uploadBuffer(req.file.buffer, folder, safeName);

    const photo = new Gallery({ subject, date, title, description, imageUrl: url, publicId });
    await photo.save();

    // Envia no canal do Discord da matéria
    await sendGalleryPhoto(photo);

    res.status(201).json({ success: true, data: photo });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Foto não encontrada" });
    await deleteFile(photo.publicId);
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
