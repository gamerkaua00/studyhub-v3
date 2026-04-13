// StudyHub v3.1.1 — server.js
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const cron     = require("node-cron");
const https    = require("https");
const http     = require("http");

const app  = express();
const PORT = process.env.PORT || 3001;
const VER  = "3.1.3";

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173", "http://localhost:4173",
    "https://gamerkaua00.github.io",
  ],
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rotas
app.use("/api/auth",       require("./routes/authRoutes"));
app.use("/api/public",     require("./routes/publicRoutes"));
app.use("/api/contents",   require("./routes/contentRoutes"));
app.use("/api/subjects",   require("./routes/subjectRoutes"));
app.use("/api/messages",   require("./routes/messageRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/gallery",    require("./routes/galleryRoutes"));
app.use("/api/holidays",   require("./routes/holidayRoutes"));
app.use("/api/events",     require("./routes/eventRoutes"));
app.use("/api/stats",      require("./routes/statsRoutes"));
app.use("/api/pdf",        require("./routes/pdfRoutes"));
app.use("/api/faults",     require("./routes/faultRoutes"));

app.get("/health", (req, res) =>
  res.json({ status: "ok", version: VER, uptime: Math.floor(process.uptime()), ts: new Date().toISOString() })
);

const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  (url.startsWith("https") ? https : http).get(`${url}/health`, () => {}).on("error", () => {});
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () => console.log(`🚀 StudyHub API v${VER} na porta ${PORT}`));

    const { runScheduler } = require("./services/scheduler");
    cron.schedule("*/1 * * * *",  runScheduler);
    cron.schedule("*/10 * * * *", keepAlive);
    cron.schedule("0 * * * *", async () => {
      const { sendDiscordNotification } = require("./services/discordNotifier");
      await sendDiscordNotification("log-bot", "", {
        title: "💚 Backend Online",
        description: `Uptime: **${Math.floor(process.uptime()/60)} min** | v${VER}`,
        color: 0x57F287, timestamp: new Date().toISOString(),
        footer: { text: "StudyHub v3.1.1 • Heartbeat" },
      });
    });
    // Backup automático todo domingo às 02:00
    cron.schedule("0 2 * * 0", async () => {
      await runBackup();
    });
    console.log(`⏰ Scheduler + keep-alive + heartbeat + backup iniciados`);
  })
  .catch((err) => { console.error("❌ MongoDB:", err.message); process.exit(1); });

const runBackup = async () => {
  try {
    const Content    = require("./models/Content");
    const Subject    = require("./models/Subject");
    const Attendance = require("./models/Attendance");
    const { sendDiscordNotification } = require("./services/discordNotifier");

    const [contents, subjects, attendances] = await Promise.all([
      Content.find().lean(),
      Subject.find().lean(),
      Attendance.find({ active: true }).lean(),
    ]);

    const backup = JSON.stringify({ version: VER, date: new Date().toISOString(), contents, subjects, attendances }, null, 2);
    const size   = (Buffer.byteLength(backup) / 1024).toFixed(1);

    await sendDiscordNotification("admin-bot", "", {
      title: "📦 Backup Automático Semanal",
      description: `✅ Backup realizado com sucesso!\n\n📊 **${contents.length}** conteúdos\n📌 **${subjects.length}** matérias\n🏫 **${attendances.length}** atendimentos\n💾 Tamanho: **${size} KB**`,
      color: 0x57F287, timestamp: new Date().toISOString(),
      footer: { text: "StudyHub v3.1.1 • Backup automático" },
    });
    console.log(`[Backup] ✅ Backup semanal realizado (${size} KB)`);
  } catch (err) {
    console.error("[Backup] ❌ Erro:", err.message);
  }
};

process.on("unhandledRejection", (r) => console.error("[Server]", String(r)));
module.exports = app;
