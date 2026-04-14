// StudyHub v3.2.0 — routes/pdfRoutes.js
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
    else cb(new Error(`Formato não suportado: ${file.mimetype}`));
  },
});

// A4 em pontos (72 DPI): 595 x 842
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 20; // margem em pontos

const addImagePage = async (pdfDoc, fileBuffer, mimetype) => {
  const { PDFDocument } = require("pdf-lib");
  const type = mimetype.toLowerCase();

  let img;
  try {
    img = type.includes("png") ? await pdfDoc.embedPng(fileBuffer) : await pdfDoc.embedJpg(fileBuffer);
  } catch {
    img = await pdfDoc.embedPng(fileBuffer); // fallback
  }

  // Calcula dimensões para caber em A4 com margem
  const maxW = A4_W - MARGIN * 2;
  const maxH = A4_H - MARGIN * 2;
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const drawW = img.width  * ratio;
  const drawH = img.height * ratio;

  // Centraliza na página
  const x = MARGIN + (maxW - drawW) / 2;
  const y = MARGIN + (maxH - drawH) / 2;

  const page = pdfDoc.addPage([A4_W, A4_H]);
  page.drawImage(img, { x, y, width: drawW, height: drawH });
  return true;
};

router.post("/convert", upload.array("images", 20), async (req, res) => {
  const files = req.files;
  const mode  = req.body.mode  || "single";
  const title = (req.body.title || "documento").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "documento";
  const pageSize = req.body.pageSize || "a4"; // a4 | original

  if (!files?.length) return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });

  const { PDFDocument } = require("pdf-lib");

  try {
    if (mode === "single") {
      const pdfDoc = await PDFDocument.create();
      let added = 0;
      for (const file of files) {
        try {
          await addImagePage(pdfDoc, file.buffer, file.mimetype);
          added++;
        } catch (e) { console.warn(`[PDF] Pulando ${file.originalname}: ${e.message}`); }
      }
      if (added === 0) return res.status(422).json({ success: false, message: "Nenhuma imagem processada. Use JPG ou PNG." });
      const bytes   = await pdfDoc.save();
      const safeName = title.replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      return res.send(Buffer.from(bytes));
    } else {
      const pdfs = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const pdfDoc = await PDFDocument.create();
          await addImagePage(pdfDoc, files[i].buffer, files[i].mimetype);
          const bytes = await pdfDoc.save();
          pdfs.push({ name: `${title.replace(/\s+/g,"_")}_p${i+1}.pdf`, data: Buffer.from(bytes).toString("base64") });
        } catch (e) { console.warn(`[PDF] Erro p${i+1}: ${e.message}`); }
      }
      if (!pdfs.length) return res.status(422).json({ success: false, message: "Nenhuma imagem processada." });
      return res.json({ success: true, pdfs, count: pdfs.length });
    }
  } catch (err) {
    console.error("[PDF]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
