// ============================================================
// StudyHub v2 — middleware/auth.js
// Proteção de rotas com sessão simples
// ============================================================

const ADMIN_USER = "mazur"; // aceita maiúsculo e minúsculo
const ADMIN_PASS = "020683";

// Sessões ativas em memória (id → { user, createdAt })
const sessions = new Map();

// Gera um token aleatório simples
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Cria uma sessão e retorna o token
const createSession = (user) => {
  const token = generateToken();
  sessions.set(token, { user, createdAt: Date.now() });
  return token;
};

// Verifica se o token é válido (expira em 24h)
const verifySession = (token) => {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  const expired = Date.now() - session.createdAt > 24 * 60 * 60 * 1000;
  if (expired) { sessions.delete(token); return null; }
  return session;
};

// Middleware que protege rotas
const requireAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ success: false, message: "Não autorizado. Faça login." });
  }
  req.user = session.user;
  next();
};

// Verifica se é admin principal (Mazur)
const requireAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const session = verifySession(token);
  if (!session || session.user.toLowerCase() !== ADMIN_USER) {
    return res.status(403).json({ success: false, message: "Acesso restrito ao administrador." });
  }
  req.user = session.user;
  next();
};

module.exports = { createSession, verifySession, requireAuth, requireAdmin, ADMIN_USER, ADMIN_PASS };
