// StudyHub v3.2.0 — models/Webhook.js
const mongoose = require("mongoose");
const webhookSchema = new mongoose.Schema({
  name:      { type: String, required: true },   // ex: "#agenda"
  channelName: { type: String, required: true }, // nome do canal
  url:       { type: String, required: true },   // URL do webhook Discord
  active:    { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model("Webhook", webhookSchema);
