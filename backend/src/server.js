// StudyHub v3 — server.js
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
const { runScheduler } = require("./services/scheduler");
const { requireAuth }  = require("./middleware/auth");
const { sendErrorLog } = require("./services/discordNotifier");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:4173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Rotas públicas
app.use("/api/auth",   authRoutes);
app.use("/api/public", publicRoutes);

// Rotas protegidas
app.use("/api/contents",    requireAuth, contentRoutes);
app.use("/api/subjects",    requireAuth, subjectRoutes);
app.use("/api/messages",    requireAuth, messageRoutes);
app.use("/api/attendance",  requireAuth, attendanceRoutes);
app.use("/api/gallery",     requireAuth, galleryRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "3.0.0", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Keep-alive: ping a cada 10 minutos para não dormir no Render
const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const lib  = url.startsWith("https") ? https : http;
  lib.get(`${url}/health`, (res) => {
    console.log(`[Keep-alive] Ping OK ${res.statusCode}`);
  }).on("error", async (err) => {
    console.warn("[Keep-alive] Falhou:", err.message);
    await sendErrorLog("Keep-alive falhou", err.message, true);
  });
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () => console.log(`🚀 StudyHub API v3 na porta ${PORT}`));

    cron.schedule("*/1 * * * *",  async () => { await runScheduler(); });
    cron.schedule("*/10 * * * *", keepAlive);

    // Heartbeat no #log-bot a cada hora
    cron.schedule("0 * * * *", async () => {
      const { sendDiscordNotification } = require("./services/discordNotifier");
      const uptime = Math.floor(process.uptime() / 60);
      await sendDiscordNotification("log-bot", "", {
        title: "💚 Backend Online",
        description: `Uptime: **${uptime} minutos**`,
        color: 0x57F287,
        timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3 • Heartbeat" },
      });
    });

    console.log("⏰ Scheduler + keep-alive + heartbeat iniciados");
  })
  .catch(async (err) => {
    console.error("❌ Erro MongoDB:", err.message);
    await sendErrorLog("Falha na conexão com MongoDB", err.message, true);
    process.exit(1);
  });

process.on("unhandledRejection", async (reason) => {
  console.error("UnhandledRejection:", reason);
  await sendErrorLog("Erro não tratado (backend)", String(reason), false);
});

module.exports = app;
