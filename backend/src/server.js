// StudyHub v3 — server.js — REVISADO E CORRIGIDO
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const cron     = require("node-cron");
const https    = require("https");
const http     = require("http");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://gamerkaua00.github.io",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rotas — cada router gerencia seu próprio auth internamente
app.use("/api/auth",       require("./routes/authRoutes"));
app.use("/api/public",     require("./routes/publicRoutes"));
app.use("/api/contents",   require("./routes/contentRoutes"));
app.use("/api/subjects",   require("./routes/subjectRoutes"));
app.use("/api/messages",   require("./routes/messageRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/gallery",    require("./routes/galleryRoutes"));
app.use("/api/holidays",   require("./routes/holidayRoutes"));
app.use("/api/events",     require("./routes/eventRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "3.1.0", uptime: Math.floor(process.uptime()), ts: new Date().toISOString() });
});

// Keep-alive silencioso
const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const lib = url.startsWith("https") ? https : http;
  lib.get(`${url}/health`, () => {}).on("error", () => {});
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () => console.log(`🚀 StudyHub API v3.1 na porta ${PORT}`));

    const { runScheduler } = require("./services/scheduler");
    cron.schedule("*/1 * * * *",  runScheduler);
    cron.schedule("*/10 * * * *", keepAlive);
    cron.schedule("0 * * * *", async () => {
      const { sendDiscordNotification } = require("./services/discordNotifier");
      const up = Math.floor(process.uptime() / 60);
      await sendDiscordNotification("log-bot", "", {
        title: "💚 Backend Online",
        description: `Uptime: **${up} min** | Versão: 3.1.0`,
        color: 0x57F287,
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3.1 • Heartbeat horário" },
      });
    });
    console.log("⏰ Scheduler + keep-alive + heartbeat iniciados");
  })
  .catch((err) => { console.error("❌ MongoDB:", err.message); process.exit(1); });

process.on("unhandledRejection", (r) => console.error("[Server]", String(r)));
module.exports = app;
