// StudyHub v3 — middleware/auth.js — CORRIGIDO com sessões no MongoDB
const Session = require("../models/Session");

const ADMIN_USER = "mazur";
const ADMIN_PASS = "020683";

const generateToken = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

const createSession = async (username, role = "estudante") => {
  const token = generateToken();
  await Session.create({ token, username, role });
  return token;
};

const verifySession = async (token) => {
  if (!token) return null;
  try {
    const session = await Session.findOne({ token });
    return session ? { user: session.username, role: session.role } : null;
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

module.exports = { createSession, verifySession, destroySession, requireAuth, requireAdmin, ADMIN_USER, ADMIN_PASS };
