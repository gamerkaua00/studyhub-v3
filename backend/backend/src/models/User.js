// ============================================================
// StudyHub v2 — models/User.js
// ============================================================
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "estudante", "amigo"], default: "estudante" },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("User", userSchema);
