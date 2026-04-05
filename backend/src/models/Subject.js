// ============================================================
// StudyHub — models/Subject.js
// Schema para matérias com cores personalizadas
// ============================================================

const mongoose = require("mongoose");

// Paleta de cores padrão (estilo Discord)
const DEFAULT_COLORS = [
  "#5865F2", "#57F287", "#FEE75C", "#EB459E",
  "#ED4245", "#2D7D46", "#1ABC9C", "#3498DB",
  "#E67E22", "#9B59B6", "#E91E63", "#00BCD4",
];

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome da matéria é obrigatório"],
      trim: true,
      unique: true,
      maxlength: [100, "Nome deve ter no máximo 100 caracteres"],
    },
    color: {
      type: String,
      required: true,
      default: () => DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      match: [/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hex"],
    },
    emoji: {
      type: String,
      default: "📚",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);
