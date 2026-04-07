// StudyHub v3 — models/Gallery.js
const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  subject:       { type: String, required: true },
  date:          { type: String, required: true },
  title:         { type: String, default: "" },
  description:   { type: String, default: "" },
  photoType:     { type: String, default: "aula", enum: ["aula","prova","atividade","avaliacao","apresentacao","lista","outro"] },
  imageUrl:      { type: String, required: true },
  publicId:      { type: String, required: true },
  sentToDiscord: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Gallery", gallerySchema);
