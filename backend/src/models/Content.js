// StudyHub v3 — models/Content.js
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true, maxlength: 200 },
  subject:        { type: String, required: true, trim: true },
  subjectColor:   { type: String, default: "#5865F2" },
  type: {
    type: String,
    enum: ["Aula", "Revisão", "Prova", "Apresentação", "Atividade", "Avaliação", "Lista"],
    required: true,
  },
  date:           { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  time:           { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  discordChannel: { type: String, required: true, trim: true },
  resourceLink:   { type: String, default: "" },
  description:    { type: String, default: "", maxlength: 1000 },
  notifications: {
    sentMain:      { type: Boolean, default: false },
    sentDayBefore: { type: Boolean, default: false },
    sentPoll:      { type: Boolean, default: false },
  },
}, { timestamps: true, versionKey: false });

contentSchema.index({ date: 1, subject: 1 });
contentSchema.index({ date: 1, "notifications.sentMain": 1 });

module.exports = mongoose.model("Content", contentSchema);
