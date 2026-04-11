// StudyHub v3 — models/Session.js
// Sessões persistentes no MongoDB (não perdem com restart do Render)
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  username:  { type: String, required: true },
  role:      { type: String, default: "estudante" },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24h automático
});

module.exports = mongoose.model("Session", sessionSchema);
