// ============================================================
// StudyHub v3 — models/Message.js
// Mensagens programadas pelo admin
// ============================================================
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  content:        { type: String, required: true, maxlength: 2000 },
  discordChannel: { type: String, required: true },
  date:           { type: String, required: true }, // YYYY-MM-DD
  time:           { type: String, required: true }, // HH:MM
  sent:           { type: Boolean, default: false },
  title:          { type: String, default: "" },
  color:          { type: String, default: "#5865F2" },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Message", messageSchema);
