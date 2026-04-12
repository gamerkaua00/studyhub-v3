// StudyHub v3.1.1 — middleware/auth.js — COM BCRYPT
const bcrypt  = require("bcryptjs");
const Session = require("../models/Session");

const ADMIN_USER = "mazur";
const ADMIN_PASS = "020683"; // usado só para comparação

const generateToken = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);

const createSession = async (username, role = "estudante") => {
  const token = generateToken();
  await Session.create({ token, username, role });
  return token;
};

const verifySession = async (token) => {
  if (!token) return null;
  try {
    const s = await Session.findOne({ token });
    return s ? { user: s.username, role: s.role } : null;
  } catch { return null; }
};

const destroySession = async (token) => {
  if (token) await Session.deleteOne({ token }).catch(() => {});
};

const requireAuth = async (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const session = await verifySession(token);
  if (!session) return res.status(401).json({ success: false, message: "Não autorizado. Faça login." });
  req.user = session.user;
  req.role = session.role;
  next();
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const session = await verifySession(token);
  if (!session || session.user.toLowerCase() !== ADMIN_USER) {
    return res.status(403).json({ success: false, message: "Acesso restrito ao administrador." });
  }
  req.user = session.user;
  req.role = "admin";
  next();
};

// Hash de senha para novos usuários
const hashPassword = async (password) => bcrypt.hash(password, 10);
const checkPassword = async (plain, hash) => {
  // Suporta senhas antigas (texto puro) e novas (hash)
  if (hash.startsWith("$2")) return bcrypt.compare(plain, hash);
  return plain === hash; // compatibilidade com senhas antigas
};

module.exports = { createSession, verifySession, destroySession, requireAuth, requireAdmin, hashPassword, checkPassword, ADMIN_USER, ADMIN_PASS };
