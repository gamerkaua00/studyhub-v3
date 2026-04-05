// ============================================================
// StudyHub v2 — routes/authRoutes.js
// Login, logout, cadastro pendente e aprovação
// ============================================================

const express = require("express");
const router = express.Router();
const PendingUser = require("../models/PendingUser");
const User = require("../models/User");
const { createSession, requireAdmin, ADMIN_USER, ADMIN_PASS } = require("../middleware/auth");
const { notifyAdminNewRequest } = require("../services/discordNotifier");

// Contador de tentativas erradas por IP
const failedAttempts = new Map();

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  // Bloqueia após 5 tentativas erradas
  const attempts = failedAttempts.get(ip) || 0;
  if (attempts >= 5) {
    return res.status(429).json({
      success: false,
      message: "Muitas tentativas. Aguarde 15 minutos.",
    });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });
  }

  // Verifica se é o admin principal (Mazur)
  if (username.toLowerCase() === ADMIN_USER && password === ADMIN_PASS) {
    failedAttempts.delete(ip);
    const token = createSession(ADMIN_USER);
    return res.json({ success: true, token, role: "admin", username: "Mazur" });
  }

  // Verifica usuários aprovados
  const user = await User.findOne({
    username: { $regex: new RegExp(`^${username}$`, "i") },
  });

  if (user && user.password === password) {
    failedAttempts.delete(ip);
    const token = createSession(user.username);
    return res.json({ success: true, token, role: user.role, username: user.username });
  }

  // Tentativa falhou
  failedAttempts.set(ip, attempts + 1);
  setTimeout(() => failedAttempts.delete(ip), 15 * 60 * 1000);

  return res.status(401).json({ success: false, message: "Usuário ou senha incorretos." });
});

// ── POST /api/auth/register ──────────────────────────────────
// Qualquer pessoa pode solicitar cadastro — fica pendente até Mazur aprovar
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios." });
  }

  // Bloqueia nome "mazur" para novos cadastros
  if (username.toLowerCase() === ADMIN_USER) {
    return res.status(400).json({ success: false, message: "Nome de usuário reservado." });
  }

  // Verifica se já existe usuário ou pedido pendente
  const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
  const existingPending = await PendingUser.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });

  if (existingUser || existingPending) {
    return res.status(400).json({ success: false, message: "Usuário já existe ou já tem cadastro pendente." });
  }

  const pending = new PendingUser({
    username,
    password,
    role: role || "estudante",
    requestedAt: new Date(),
  });
  await pending.save();

  // Avisa o Mazur no Discord sobre o novo pedido
  await notifyAdminNewRequest(username, role || "estudante");

  res.json({ success: true, message: "Solicitação enviada! Aguarde aprovação do administrador." });
});

// ── GET /api/auth/pending ────────────────────────────────────
// Só Mazur vê os pedidos pendentes
router.get("/pending", requireAdmin, async (req, res) => {
  const pending = await PendingUser.find().sort({ requestedAt: -1 });
  res.json({ success: true, data: pending });
});

// ── POST /api/auth/approve/:id ───────────────────────────────
router.post("/approve/:id", requireAdmin, async (req, res) => {
  const pending = await PendingUser.findById(req.params.id);
  if (!pending) return res.status(404).json({ success: false, message: "Solicitação não encontrada." });

  const user = new User({
    username: pending.username,
    password: pending.password,
    role: pending.role,
  });
  await user.save();
  await PendingUser.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: `Usuário ${pending.username} aprovado!` });
});

// ── POST /api/auth/reject/:id ────────────────────────────────
router.post("/reject/:id", requireAdmin, async (req, res) => {
  await PendingUser.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Solicitação rejeitada." });
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logout realizado." });
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get("/me", (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const { verifySession } = require("../middleware/auth");
  const session = verifySession(token);
  if (!session) return res.status(401).json({ success: false });
  res.json({ success: true, username: session.user });
});

module.exports = router;
