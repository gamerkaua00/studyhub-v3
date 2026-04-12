// StudyHub v3.1.1 — routes/galleryRoutes.js — MÚLTIPLAS IMAGENS
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const Gallery  = require("../models/Gallery");
const { requireAuth } = require("../middleware/auth");
const { uploadBuffer, deleteFile } = require("../services/cloudinaryService");
const { sendDiscordNotification } = require("../services/discordNotifier");

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // até 10 fotos por vez
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

const TYPE_EMOJI  = { aula:"📖", prova:"📝", atividade:"📋", avaliacao:"📊", apresentacao:"🎤", lista:"📃", outro:"📁" };
const TYPE_LABEL  = { aula:"Aula", prova:"Prova", atividade:"Atividade", avaliacao:"Avaliação", apresentacao:"Apresentação", lista:"Lista", outro:"Outro" };

router.get("/", async (req, res) => {
  try {
    const filter = req.query.subject ? { subject: req.query.subject } : {};
    const photos = await Gallery.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: photos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Upload de múltiplas fotos — campo "photos" (array)
router.post("/", upload.array("photos", 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Nenhuma foto enviada" });
    }

    const { subject, date, title, description, photoType = "aula" } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: "Matéria é obrigatória" });
    if (!date)    return res.status(400).json({ success: false, message: "Data é obrigatória" });

    const folder = `studyhub/${subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")}`;
    const saved  = [];

    // Faz upload de todas as fotos
    for (let i = 0; i < files.length; i++) {
      const file     = files[i];
      const safeName = `${subject}_${date}_${Date.now()}_${i}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");

      const { url, publicId } = await uploadBuffer(file.buffer, folder, safeName);
      const pageNum = files.length > 1 ? ` (${i + 1}/${files.length})` : "";
      const photo   = new Gallery({
        subject, date,
        title: title ? `${title}${pageNum}` : "",
        description,
        photoType,
        imageUrl: url,
        publicId,
      });
      await photo.save();
      saved.push(photo);
    }

    // Envia no Discord — primeira foto com embed, demais como imagens simples
    const channelName = subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [y, m, d]   = date.split("-");
    const emoji       = TYPE_EMOJI[photoType] || "📷";
    const typeLabel   = TYPE_LABEL[photoType] || photoType;

    if (saved.length === 1) {
      await sendDiscordNotification(channelName, "", {
        title: `${emoji} ${subject} • ${d}/${m}/${y} — ${typeLabel}`,
        description: title || description || `Foto de ${typeLabel.toLowerCase()}`,
        color: 0x3498DB,
        image: { url: saved[0].imageUrl },
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3.1.1 • Galeria" },
      });
    } else {
      // Múltiplas: envia embed + imagens individuais
      await sendDiscordNotification(channelName, "", {
        title: `${emoji} ${subject} • ${d}/${m}/${y} — ${typeLabel} (${saved.length} páginas)`,
        description: title || `${saved.length} fotos de ${typeLabel.toLowerCase()}`,
        color: 0x3498DB,
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3.1.1 • Galeria" },
      });
      // Envia cada imagem
      for (let i = 0; i < saved.length; i++) {
        await sendDiscordNotification(channelName, `Página ${i + 1}/${saved.length}`, {
          image: { url: saved[i].imageUrl },
          color: 0x3498DB,
        });
      }
    }

    res.status(201).json({ success: true, data: saved, count: saved.length });
  } catch (e) {
    console.error("[Gallery] Erro:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
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
