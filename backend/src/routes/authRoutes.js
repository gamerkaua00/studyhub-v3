// StudyHub v3 — routes/authRoutes.js — CORRIGIDO
const express = require("express");
const router  = express.Router();
const PendingUser = require("../models/PendingUser");
const User        = require("../models/User");
const { createSession, destroySession, requireAdmin, verifySession, ADMIN_USER, ADMIN_PASS } = require("../middleware/auth");
const { notifyAdminNewRequest } = require("../services/discordNotifier");

const failedAttempts = new Map();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  const attempts = failedAttempts.get(ip) || 0;
  if (attempts >= 5) return res.status(429).json({ success: false, message: "Muitas tentativas. Aguarde 15 minutos." });
  if (!username || !password) return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });

  // Admin principal
  if (username.toLowerCase() === ADMIN_USER && password === ADMIN_PASS) {
    failedAttempts.delete(ip);
    const token = await createSession(ADMIN_USER, "admin");
    return res.json({ success: true, token, role: "admin", username: "Mazur" });
  }

  // Usuários aprovados
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  if (user && user.password === password) {
    failedAttempts.delete(ip);
    const token = await createSession(user.username, user.role);
    return res.json({ success: true, token, role: user.role, username: user.username });
  }

  failedAttempts.set(ip, attempts + 1);
  setTimeout(() => failedAttempts.delete(ip), 15 * 60 * 1000);
  return res.status(401).json({ success: false, message: "Usuário ou senha incorretos." });
});

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });
  if (username.toLowerCase() === ADMIN_USER) return res.status(400).json({ success: false, message: "Nome reservado." });

  const existingUser    = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  const existingPending = await PendingUser.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  if (existingUser || existingPending) return res.status(400).json({ success: false, message: "Usuário já existe ou já tem cadastro pendente." });

  await new PendingUser({ username, password, role: role || "estudante", requestedAt: new Date() }).save();
  await notifyAdminNewRequest(username, role || "estudante");
  res.json({ success: true, message: "Solicitação enviada! Aguarde aprovação." });
});

router.get("/pending", requireAdmin, async (req, res) => {
  const pending = await PendingUser.find().sort({ requestedAt: -1 });
  res.json({ success: true, data: pending });
});

router.post("/approve/:id", requireAdmin, async (req, res) => {
  const pending = await PendingUser.findById(req.params.id);
  if (!pending) return res.status(404).json({ success: false, message: "Não encontrado." });
  await new User({ username: pending.username, password: pending.password, role: pending.role }).save();
  await PendingUser.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: `${pending.username} aprovado!` });
});

router.post("/reject/:id", requireAdmin, async (req, res) => {
  await PendingUser.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Rejeitado." });
});

router.post("/logout", async (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  await destroySession(token);
  res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const token   = req.headers["authorization"]?.replace("Bearer ", "");
  const session = await verifySession(token);
  if (!session) return res.status(401).json({ success: false });
  res.json({ success: true, username: session.user, role: session.role });
});


// GET /api/auth/users — lista usuários aprovados (só admin)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/auth/users/:id — remove acesso de usuário (só admin)
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    // Remove sessões ativas do usuário
    const Session = require("../models/Session");
    await Session.deleteMany({ username: user.username });
    res.json({ success: true, message: `Acesso de "${user.username}" removido.` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
