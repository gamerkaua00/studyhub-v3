// ============================================================
// StudyHub v2 — pages/LoginPage.jsx
// ============================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate        = useNavigate();
  const { login }       = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          <h1 className={styles.logoText}>StudyHub</h1>
          <p className={styles.logoSub}>Plataforma de Gerenciamento de Estudos</p>
        </div>

        {/* Formulário de login */}
        {!showRegister ? (
          <>
            <form onSubmit={handleLogin} className={styles.form}>
              <h2 className={styles.title}>Entrar</h2>

              {error && <div className={styles.error}>⚠️ {error}</div>}

              <div className={styles.field}>
                <label>Usuário</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Seu usuário"
                  autoFocus
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Senha</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Sua senha"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Entrando..." : "Entrar →"}
              </button>
            </form>

            <button
              className={styles.registerLink}
              onClick={() => setShowRegister(true)}
            >
              Não tem conta? Solicitar cadastro
            </button>

            {/* Acesso público à agenda */}
            <button
              className={styles.publicLink}
              onClick={() => navigate("/agenda-publica")}
            >
              👁️ Ver agenda sem login
            </button>
          </>
        ) : (
          <RegisterForm onBack={() => setShowRegister(false)} />
        )}
      </div>
    </div>
  );
}

// ── Formulário de cadastro ────────────────────────────────────
function RegisterForm({ onBack }) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const [form, setForm] = useState({ username: "", password: "", role: "estudante" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ ok: true, msg: data.message });
      } else {
        setStatus({ ok: false, msg: data.message });
      }
    } catch {
      setStatus({ ok: false, msg: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className={styles.form}>
      <h2 className={styles.title}>Solicitar Cadastro</h2>
      <p className={styles.registerInfo}>
        Sua solicitação será analisada pelo administrador. Você será notificado no Discord.
      </p>

      {status && (
        <div className={status.ok ? styles.success : styles.error}>
          {status.ok ? "✅" : "⚠️"} {status.msg}
        </div>
      )}

      {!status?.ok && (
        <>
          <div className={styles.field}>
            <label>Usuário</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Escolha um usuário"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Escolha uma senha"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Perfil</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="estudante">📚 Estudante</option>
              <option value="amigo">🤝 Amigo</option>
              <option value="admin">🛡️ Admin</option>
            </select>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Enviando..." : "Solicitar Cadastro"}
          </button>
        </>
      )}

      <button type="button" className={styles.registerLink} onClick={onBack}>
        ← Voltar ao login
      </button>
    </form>
  );
}
