// StudyHub v3.1.2 — routes/pdfRoutes.js
// Converte imagens para PDF usando pdf-lib (sem sharp)
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
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

// Converte imagem para JPEG/PNG compatível com pdf-lib
// pdf-lib aceita: JPEG e PNG nativamente
const prepareImage = async (file) => {
  const { PDFDocument } = require("pdf-lib");
  const mime = file.mimetype.toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png") {
    return { buffer: file.buffer, type: mime.includes("png") ? "png" : "jpg" };
  }
  // Para WEBP e outros formatos, tenta tratar como JPG (fallback)
  // Render tem node-canvas disponível às vezes, mas não queremos depender disso
  // Melhor abordagem: retornar null e pular imagens não suportadas
  return null;
};

router.post("/convert", upload.array("images", 20), async (req, res) => {
  const files = req.files;
  const mode  = req.body.mode  || "single";
  const title = req.body.title || "documento";

  if (!files?.length) {
    return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
  }

  try {
    const { PDFDocument } = require("pdf-lib");

    if (mode === "single") {
      const pdfDoc = await PDFDocument.create();
      let added = 0;

      for (const file of files) {
        try {
          const prepared = await prepareImage(file);
          if (!prepared) {
            console.warn(`[PDF] Formato não suportado: ${file.mimetype} — pulando`);
            continue;
          }
          const imgEmbed = prepared.type === "png"
            ? await pdfDoc.embedPng(prepared.buffer)
            : await pdfDoc.embedJpg(prepared.buffer);

          const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
          page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });
          added++;
        } catch (e) {
          console.warn(`[PDF] Erro ao processar imagem: ${e.message}`);
        }
      }

      if (added === 0) {
        return res.status(400).json({ success: false, message: "Nenhuma imagem pôde ser convertida. Use apenas JPG ou PNG." });
      }

      const pdfBytes = await pdfDoc.save();
      const safeName = title.replace(/[^a-zA-Z0-9_\-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.send(Buffer.from(pdfBytes));

    } else {
      // Um PDF por imagem
      const pdfs = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const prepared = await prepareImage(file);
          if (!prepared) continue;

          const pdfDoc   = await PDFDocument.create();
          const imgEmbed = prepared.type === "png"
            ? await pdfDoc.embedPng(prepared.buffer)
            : await pdfDoc.embedJpg(prepared.buffer);

          const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
          page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });

          const pdfBytes = await pdfDoc.save();
          const safeName = `${title.replace(/[^a-zA-Z0-9_\-]/g, "_")}_${i + 1}`;
          pdfs.push({
            name: `${safeName}.pdf`,
            data: Buffer.from(pdfBytes).toString("base64"),
          });
        } catch (e) {
          console.warn(`[PDF] Erro na imagem ${i + 1}: ${e.message}`);
        }
      }

      if (pdfs.length === 0) {
        return res.status(400).json({ success: false, message: "Nenhuma imagem pôde ser convertida. Use JPG ou PNG." });
      }

      res.json({ success: true, pdfs, count: pdfs.length });
    }
  } catch (err) {
    console.error("[PDF] Erro geral:", err.message);
    res.status(500).json({ success: false, message: `Erro na conversão: ${err.message}` });
  }
});

module.exports = router;
