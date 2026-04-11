// StudyHub v3 — LoginPage.jsx — Design melhorado
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ username: "", password: "" });
  const [mode, setMode]     = useState("login"); // login | register
  const [role, setRole]     = useState("estudante");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return setError("Preencha todos os campos.");
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password, role }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Solicitação enviada! Aguarde aprovação do administrador.");
        setMode("login"); setForm({ username: "", password: "" });
      } else { setError(data.message); }
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          <h1 className={styles.title}>StudyHub</h1>
          <p className={styles.subtitle}>Sistema de gerenciamento de estudos</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`} onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>Entrar</button>
          <button className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`} onClick={() => { setMode("register"); setError(null); setSuccess(null); }}>Solicitar acesso</button>
        </div>

        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label>Usuário</label>
              <input type="text" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="Digite seu usuário" autoFocus required />
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Entrando...</> : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label>Usuário</label>
              <input type="text" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="Escolha um nome de usuário" autoFocus required />
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            <div className={styles.field}>
              <label>Tipo de conta</label>
              <div className={styles.roleGrid}>
                {[{ v:"estudante", l:"🎓 Estudante" }, { v:"amigo", l:"🤝 Amigo" }].map((r) => (
                  <button type="button" key={r.v} className={`${styles.roleBtn} ${role === r.v ? styles.roleActive : ""}`} onClick={() => setRole(r.v)}>{r.l}</button>
                ))}
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Enviando...</> : "Solicitar Acesso"}
            </button>
          </form>
        )}

        <p className={styles.hint}>
          {mode === "login" ? "Não tem acesso? Solicite ao administrador." : "Sua solicitação será analisada pelo administrador."}
        </p>
      </div>
    </div>
  );
}
