// StudyHub v3.1.2 — routes/pdfRoutes.js
// Converte imagens em PDF (separado ou unificado)
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens"));
  },
});

// POST /api/pdf/convert
// mode: "single" (um PDF) | "multiple" (um por imagem)
router.post("/convert", upload.array("images", 20), async (req, res) => {
  const { PDFDocument } = require("pdf-lib");
  const files = req.files;
  const mode  = req.body.mode || "single"; // "single" | "multiple"
  const title = req.body.title || "documento";

  if (!files?.length) return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });

  try {
    if (mode === "single") {
      // Junta todas as imagens em um PDF
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        let imgEmbed;
        try {
          if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
            imgEmbed = await pdfDoc.embedJpg(file.buffer);
          } else if (file.mimetype === "image/png") {
            imgEmbed = await pdfDoc.embedPng(file.buffer);
          } else {
            // Para outros formatos, converte para PNG via sharp se disponível
            const sharp = require("sharp");
            const pngBuf = await sharp(file.buffer).png().toBuffer();
            imgEmbed = await pdfDoc.embedPng(pngBuf);
          }
          const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
          page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });
        } catch (e) {
          console.warn(`[PDF] Pulando imagem inválida: ${e.message}`);
        }
      }
      const pdfBytes = await pdfDoc.save();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } else {
      // Um PDF por imagem — retorna múltiplos como base64 JSON
      const pdfs = [];
      for (let i = 0; i < files.length; i++) {
        const file   = files[i];
        const pdfDoc = await PDFDocument.create();
        try {
          let imgEmbed;
          if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
            imgEmbed = await pdfDoc.embedJpg(file.buffer);
          } else {
            const sharp = require("sharp");
            const pngBuf = await sharp(file.buffer).png().toBuffer();
            imgEmbed = await pdfDoc.embedPng(pngBuf);
          }
          const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
          page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });
          const pdfBytes = await pdfDoc.save();
          pdfs.push({
            name: `${title}_${i + 1}.pdf`,
            data: Buffer.from(pdfBytes).toString("base64"),
          });
        } catch (e) {
          console.warn(`[PDF] Erro na imagem ${i + 1}: ${e.message}`);
        }
      }
      res.json({ success: true, pdfs, count: pdfs.length });
    }
  } catch (err) {
    console.error("[PDF] Erro:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
