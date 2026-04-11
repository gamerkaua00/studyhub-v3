// StudyHub v3 — PendingUsers.jsx — cadastros pendentes + usuários existentes
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import styles from "./PendingUsers.module.css";

export default function PendingUsers() {
  const [pending, setPending]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [tab, setTab]           = useState("pending"); // pending | users
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([
        api.get("/api/auth/pending"),
        api.get("/api/auth/users"),
      ]);
      setPending(p.data || []);
      setUsers(u.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const notify = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const approve = async (id) => {
    try { await api.post(`/api/auth/approve/${id}`); notify("✅ Aprovado!"); fetchAll(); }
    catch (e) { notify("❌ " + e.message, false); }
  };

  const reject = async (id) => {
    if (!confirm("Rejeitar este cadastro?")) return;
    try { await api.post(`/api/auth/reject/${id}`); notify("🗑️ Rejeitado."); fetchAll(); }
    catch (e) { notify("❌ " + e.message, false); }
  };

  const removeUser = async (id, name) => {
    if (!confirm(`Remover acesso de "${name}"? Esta ação não pode ser desfeita.`)) return;
    try { await api.delete(`/api/auth/users/${id}`); notify(`🗑️ Acesso de "${name}" removido.`); fetchAll(); }
    catch (e) { notify("❌ " + e.message, false); }
  };

  const ROLE_LABEL = { admin: "🛡️ Admin", estudante: "🎓 Estudante", amigo: "🤝 Amigo" };
  const ROLE_COLOR = { admin: "#ED4245", estudante: "#5865F2", amigo: "#57F287" };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gerenciamento de Acesso</h2>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "pending" ? styles.tabActive : ""}`} onClick={() => setTab("pending")}>
            Pendentes {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
          </button>
          <button className={`${styles.tab} ${tab === "users" ? styles.tabActive : ""}`} onClick={() => setTab("users")}>
            Usuários {users.length > 0 && <span className={styles.badgeGray}>{users.length}</span>}
          </button>
        </div>
      </div>

      {msg && <div className={`${styles.msg} ${msg.ok ? styles.msgOk : styles.msgErr}`}>{msg.text}</div>}

      {loading ? (
        <div className={styles.empty}>Carregando...</div>
      ) : tab === "pending" ? (
        <>
          {pending.length === 0 ? (
            <div className={styles.empty}>
              <span>✅</span>
              <p>Nenhum cadastro pendente.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {pending.map((u) => (
                <div key={u._id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.avatar}>{u.username[0].toUpperCase()}</div>
                    <div>
                      <p className={styles.name}>{u.username}</p>
                      <span className={styles.roleTag} style={{ background: `${ROLE_COLOR[u.role] || "#5865F2"}22`, color: ROLE_COLOR[u.role] || "#5865F2" }}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                      <p className={styles.date}>Solicitado em {new Date(u.requestedAt || u.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.approveBtn} onClick={() => approve(u._id)}>✅ Aprovar</button>
                    <button className={styles.rejectBtn}  onClick={() => reject(u._id)}>❌ Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {users.length === 0 ? (
            <div className={styles.empty}><span>👥</span><p>Nenhum usuário cadastrado ainda.</p></div>
          ) : (
            <div className={styles.list}>
              {users.map((u) => (
                <div key={u._id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.avatar}>{u.username[0].toUpperCase()}</div>
                    <div>
                      <p className={styles.name}>{u.username}</p>
                      <span className={styles.roleTag} style={{ background: `${ROLE_COLOR[u.role] || "#5865F2"}22`, color: ROLE_COLOR[u.role] || "#5865F2" }}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                      <p className={styles.date}>Cadastrado em {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.rejectBtn} onClick={() => removeUser(u._id, u.username)}>🗑️ Remover acesso</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
