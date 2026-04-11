// StudyHub v3 — server.js — REVISADO
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const cron     = require("node-cron");
const https    = require("https");
const http     = require("http");

const contentRoutes    = require("./routes/contentRoutes");
const subjectRoutes    = require("./routes/subjectRoutes");
const authRoutes       = require("./routes/authRoutes");
const publicRoutes     = require("./routes/publicRoutes");
const messageRoutes    = require("./routes/messageRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const galleryRoutes    = require("./routes/galleryRoutes");
const holidayRoutes    = require("./routes/holidayRoutes");
const eventRoutes      = require("./routes/eventRoutes");
const { runScheduler } = require("./services/scheduler");

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
  credentials: true,
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Rotas públicas (sem auth) ────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/public",  publicRoutes);

// ── Rotas protegidas (auth dentro de cada router) ────────────
app.use("/api/contents",    contentRoutes);
app.use("/api/subjects",    subjectRoutes);
app.use("/api/messages",    messageRoutes);
app.use("/api/attendance",  attendanceRoutes);
app.use("/api/gallery",     galleryRoutes);
app.use("/api/holidays",    holidayRoutes);
app.use("/api/events",      eventRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "3.0.0", uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

// ── Keep-alive ───────────────────────────────────────────────
const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const lib  = url.startsWith("https") ? https : http;
  lib.get(`${url}/health`, () => {}).on("error", () => {});
};

// ── MongoDB + Start ─────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () => console.log(`🚀 StudyHub API v3 na porta ${PORT}`));

    // Scheduler a cada minuto
    cron.schedule("*/1 * * * *", runScheduler);
    // Keep-alive a cada 10 min
    cron.schedule("*/10 * * * *", keepAlive);
    // Heartbeat horário
    cron.schedule("0 * * * *", async () => {
      const { sendDiscordNotification } = require("./services/discordNotifier");
      const up = Math.floor(process.uptime() / 60);
      await sendDiscordNotification("log-bot", "", {
        title: "💚 Backend Online",
        description: `Uptime: **${up} minutos**`,
        color: 0x57F287,
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3 • Heartbeat" },
      });
    });

    console.log("⏰ Scheduler + keep-alive + heartbeat iniciados");
  })
  .catch((err) => {
    console.error("❌ MongoDB erro:", err.message);
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  console.error("[Server] UnhandledRejection:", String(reason));
});

module.exports = app;
