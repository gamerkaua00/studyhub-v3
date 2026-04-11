// StudyHub v3 — models/Holiday.js
const mongoose = require("mongoose");
const holidaySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  date:      { type: String, required: true }, // YYYY-MM-DD
  type:      { type: String, enum: ["nacional", "estadual", "municipal", "escolar", "outro"], default: "nacional" },
  recurring: { type: Boolean, default: true }, // repete todo ano
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model("Holiday", holidaySchema);
