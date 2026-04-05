// ============================================================
// StudyHub v2 — pages/PendingUsers.jsx
// Painel de aprovação de cadastros (só Mazur acessa)
// ============================================================

import React, { useState, useEffect } from "react";
import { contentApi } from "../utils/api";
import styles from "./PendingUsers.module.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("studyhub_token")}`,
  "Content-Type": "application/json",
});

export default function PendingUsers() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/auth/pending`, { headers: authHeader() });
      const data = await res.json();
      setPending(data.data || []);
    } catch { setPending([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id, username) => {
    try {
      await fetch(`${BASE_URL}/api/auth/approve/${id}`, { method: "POST", headers: authHeader() });
      setMsg({ ok: true, text: `✅ ${username} aprovado!` });
      fetchPending();
    } catch { setMsg({ ok: false, text: "Erro ao aprovar." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleReject = async (id, username) => {
    if (!confirm(`Rejeitar o cadastro de "${username}"?`)) return;
    try {
      await fetch(`${BASE_URL}/api/auth/reject/${id}`, { method: "POST", headers: authHeader() });
      setMsg({ ok: true, text: `🗑️ ${username} rejeitado.` });
      fetchPending();
    } catch { setMsg({ ok: false, text: "Erro ao rejeitar." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const roleLabel = { estudante: "📚 Estudante", amigo: "🤝 Amigo", admin: "🛡️ Admin" };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>🔔 Cadastros Pendentes</h2>
        <span className={styles.count}>{pending.length}</span>
      </div>

      {msg && (
        <div className={msg.ok ? styles.success : styles.error}>{msg.text}</div>
      )}

      {loading ? (
        <div className={styles.loading}>⏳ Carregando...</div>
      ) : pending.length === 0 ? (
        <div className={styles.empty}>
          <span>✅</span>
          <p>Nenhum cadastro pendente. Tudo em dia!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {pending.map((p) => (
            <div key={p._id} className={styles.card}>
              <div className={styles.cardInfo}>
                <span className={styles.username}>👤 {p.username}</span>
                <span className={styles.role}>{roleLabel[p.role] || p.role}</span>
                <span className={styles.date}>
                  Solicitado em {new Date(p.requestedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.approveBtn}
                  onClick={() => handleApprove(p._id, p.username)}
                >
                  ✅ Aprovar
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleReject(p._id, p.username)}
                >
                  ❌ Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
