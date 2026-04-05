// ============================================================
// StudyHub v3 — models/Attendance.js
// Painel de atendimento por matéria
// ============================================================
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  subject:       { type: String, required: true },
  teacher:       { type: String, required: true },
  room:          { type: String, default: "" },
  days:          [{ type: String }], // ["Segunda", "Quarta"]
  startTime:     { type: String, required: true }, // HH:MM
  endTime:       { type: String, required: true },
  notes:         { type: String, default: "" },
  discordChannel:{ type: String, default: "" }, // nome do canal criado
  active:        { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Attendance", attendanceSchema);
