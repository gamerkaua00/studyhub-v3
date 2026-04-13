// StudyHub v3.1.3 — routes/pdfRoutes.js
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg","image/jpg","image/png","image/webp"].includes(file.mimetype.toLowerCase());
    if (ok) cb(null, true);
    else cb(new Error(`Formato não suportado: ${file.mimetype}. Use JPG ou PNG.`));
  },
});

const embedImageInPdf = async (pdfDoc, fileBuffer, mimetype) => {
  const { PDFDocument } = require("pdf-lib");
  const type = mimetype.toLowerCase();
  let img;
  try {
    if (type.includes("png")) {
      img = await pdfDoc.embedPng(fileBuffer);
    } else {
      // JPEG, WEBP tratados como JPEG (Discord envia WEBP as JPEG-compatible)
      img = await pdfDoc.embedJpg(fileBuffer);
    }
  } catch {
    // Fallback: tenta como PNG
    img = await pdfDoc.embedPng(fileBuffer);
  }
  return img;
};

// POST /api/pdf/convert
router.post("/convert", upload.array("images", 20), async (req, res) => {
  const files = req.files;
  const mode  = req.body.mode  || "single";
  const title = (req.body.title || "documento").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || "documento";

  if (!files?.length) {
    return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
  }

  const { PDFDocument } = require("pdf-lib");

  try {
    if (mode === "single") {
      // Todas as imagens em um único PDF
      const pdfDoc = await PDFDocument.create();
      let added = 0;

      for (const file of files) {
        try {
          const img  = await embedImageInPdf(pdfDoc, file.buffer, file.mimetype);
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          added++;
        } catch (e) {
          console.warn(`[PDF] Pulando imagem (${file.originalname}): ${e.message}`);
        }
      }

      if (added === 0) {
        return res.status(422).json({ success: false, message: "Nenhuma imagem pôde ser processada. Verifique se são arquivos JPG ou PNG válidos." });
      }

      const pdfBytes = await pdfDoc.save();
      const safeName = title.replace(/\s+/g, "_");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.setHeader("X-Pages", String(added));
      return res.send(Buffer.from(pdfBytes));

    } else {
      // Um PDF por imagem
      const pdfs = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const pdfDoc = await PDFDocument.create();
          const img    = await embedImageInPdf(pdfDoc, files[i].buffer, files[i].mimetype);
          const page   = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          const bytes  = await pdfDoc.save();
          const name   = `${title.replace(/\s+/g,"_")}_pagina_${i + 1}.pdf`;
          pdfs.push({ name, data: Buffer.from(bytes).toString("base64") });
        } catch (e) {
          console.warn(`[PDF] Erro página ${i+1}: ${e.message}`);
        }
      }

      if (pdfs.length === 0) {
        return res.status(422).json({ success: false, message: "Nenhuma imagem pôde ser processada." });
      }

      return res.json({ success: true, pdfs, count: pdfs.length });
    }
  } catch (err) {
    console.error("[PDF] Erro crítico:", err.message);
    return res.status(500).json({ success: false, message: `Erro interno: ${err.message}` });
  }
});

module.exports = router;
