// ============================================================
// StudyHub — models/Content.js
// Schema Mongoose para conteúdos de estudo
// ============================================================

const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    // Título do conteúdo
    title: {
      type: String,
      required: [true, "Título é obrigatório"],
      trim: true,
      maxlength: [200, "Título deve ter no máximo 200 caracteres"],
    },

    // Matéria (ex: Física, Matemática, Química)
    subject: {
      type: String,
      required: [true, "Matéria é obrigatória"],
      trim: true,
    },

    // Cor da matéria (hex, para o calendário)
    subjectColor: {
      type: String,
      default: "#5865F2",
      match: [/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hex (#RRGGBB)"],
    },

    // Tipo do conteúdo
    type: {
      type: String,
      enum: ["Aula", "Revisão", "Prova"],
      required: [true, "Tipo é obrigatório"],
    },

    // Data agendada (armazenada como string YYYY-MM-DD para evitar problemas de timezone)
    date: {
      type: String,
      required: [true, "Data é obrigatória"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"],
    },

    // Horário agendado (HH:MM)
    time: {
      type: String,
      required: [true, "Horário é obrigatório"],
      match: [/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"],
    },

    // Canal do Discord onde a notificação será enviada
    discordChannel: {
      type: String,
      required: [true, "Canal do Discord é obrigatório"],
      trim: true,
    },

    // Link ou URL de material de apoio
    resourceLink: {
      type: String,
      trim: true,
      default: "",
    },

    // Descrição/observações adicionais
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Descrição deve ter no máximo 1000 caracteres"],
    },

    // Controle de notificações já enviadas
    notifications: {
      // Notificação principal (no horário)
      sentMain: { type: Boolean, default: false },
      // Aviso de "1 dia antes" (apenas para provas)
      sentDayBefore: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true, // createdAt / updatedAt automáticos
    versionKey: false,
  }
);

// Índice composto para consultas por data + matéria
contentSchema.index({ date: 1, subject: 1 });

// Índice para buscar conteúdos não notificados por data
contentSchema.index({ date: 1, "notifications.sentMain": 1 });

module.exports = mongoose.model("Content", contentSchema);
