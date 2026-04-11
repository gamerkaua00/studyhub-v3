// StudyHub v3 — models/Event.js — eventos customizados no calendário
const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  date:        { type: String, required: true }, // YYYY-MM-DD
  time:        { type: String, default: "" },
  endDate:     { type: String, default: "" }, // para eventos multi-dia
  color:       { type: String, default: "#FEE75C" },
  icon:        { type: String, default: "📌" },
  description: { type: String, default: "" },
  type:        { type: String, enum: ["evento", "reuniao", "prazo", "viagem", "outro"], default: "evento" },
  notifyDiscord: { type: Boolean, default: false },
  discordChannel:{ type: String, default: "agenda" },
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model("Event", eventSchema);
