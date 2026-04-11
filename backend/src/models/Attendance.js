// StudyHub v3 — models/Attendance.js — múltiplos horários por matéria
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  days:      [{ type: String }],
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  room:      { type: String, default: "" },
  notes:     { type: String, default: "" },
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  subject:        { type: String, required: true },
  teacher:        { type: String, required: true },
  discordChannel: { type: String, default: "" },
  active:         { type: Boolean, default: true },
  schedules:      [scheduleSchema], // múltiplos horários
  // Campos legados mantidos para compatibilidade
  room:      { type: String, default: "" },
  days:      [{ type: String }],
  startTime: { type: String, default: "08:00" },
  endTime:   { type: String, default: "10:00" },
  notes:     { type: String, default: "" },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Attendance", attendanceSchema);
