// StudyHub v3.1.2 — models/Fault.js — controle de faltas
const mongoose = require("mongoose");
const faultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  subject:     { type: String, required: true },
  date:        { type: String, required: true }, // YYYY-MM-DD
  note:        { type: String, default: "" },
  justified:   { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

faultSchema.index({ studentName: 1, subject: 1 });
module.exports = mongoose.model("Fault", faultSchema);
