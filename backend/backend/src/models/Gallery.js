// ============================================================
// StudyHub v3 — models/Gallery.js
// Fotos de aulas organizadas por matéria e data
// ============================================================
const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  subject:     { type: String, required: true },
  date:        { type: String, required: true }, // YYYY-MM-DD
  title:       { type: String, default: "" },
  description: { type: String, default: "" },
  imageUrl:    { type: String, required: true },
  publicId:    { type: String, required: true }, // Cloudinary public_id
  sentToDiscord: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Gallery", gallerySchema);
