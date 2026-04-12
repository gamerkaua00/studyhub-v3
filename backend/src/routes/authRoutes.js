// StudyHub v3.1.1 — routes/authRoutes.js
const express = require("express");
const router  = express.Router();
const PendingUser = require("../models/PendingUser");
const User        = require("../models/User");
const Session     = require("../models/Session");
const { createSession, destroySession, requireAdmin, verifySession, hashPassword, checkPassword, ADMIN_USER, ADMIN_PASS } = require("../middleware/auth");
const { notifyAdminNewRequest } = require("../services/discordNotifier");

const failedAttempts = new Map();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const attempts = failedAttempts.get(ip) || 0;
  if (attempts >= 5) return res.status(429).json({ success: false, message: "Muitas tentativas. Aguarde 15 minutos." });
  if (!username || !password) return res.status(400).json({ success: false, message: "Usuário e senha obrigatórios." });

  // Admin
  if (username.toLowerCase() === ADMIN_USER && password === ADMIN_PASS) {
    failedAttempts.delete(ip);
    const token = await createSession(ADMIN_USER, "admin");
    return res.json({ success: true, token, role: "admin", username: "Mazur" });
  }

  // Usuário aprovado
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  if (user && await checkPassword(password, user.password)) {
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
  if (!username || !password) return res.status(400).json({ success: false, message: "Campos obrigatórios." });
  if (username.toLowerCase() === ADMIN_USER) return res.status(400).json({ success: false, message: "Nome reservado." });
  const exists = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  const pending = await PendingUser.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  if (exists || pending) return res.status(400).json({ success: false, message: "Usuário já existe ou já tem pedido pendente." });
  const hashed = await hashPassword(password);
  await new PendingUser({ username, password: hashed, role: role || "estudante", requestedAt: new Date() }).save();
  await notifyAdminNewRequest(username, role || "estudante");
  res.json({ success: true, message: "Solicitação enviada! Aguarde aprovação." });
});

router.get("/pending", requireAdmin, async (req, res) => {
  const p = await PendingUser.find().sort({ requestedAt: -1 });
  res.json({ success: true, data: p });
});

router.post("/approve/:id", requireAdmin, async (req, res) => {
  const p = await PendingUser.findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: "Não encontrado." });
  await new User({ username: p.username, password: p.password, role: p.role }).save();
  await PendingUser.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: `${p.username} aprovado!` });
});

router.post("/reject/:id", requireAdmin, async (req, res) => {
  await PendingUser.findByIdAndDelete(req.params.id);
  res.json({ success: true });
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

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Não encontrado." });
    await Session.deleteMany({ username: user.username });
    res.json({ success: true, message: `Acesso de "${user.username}" removido.` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
