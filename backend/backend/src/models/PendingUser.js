// ============================================================
// StudyHub v2 — models/PendingUser.js
// ============================================================
const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "estudante", "amigo"], default: "estudante" },
  requestedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("PendingUser", pendingUserSchema);
