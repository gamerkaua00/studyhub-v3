// StudyHub v3.2.0 — WebhooksPage.jsx
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import styles from "./WebhooksPage.module.css";

const COMMON_CHANNELS = ["agenda","avisos-provas","conteudos","admin-bot","log-bot","anuncios","materiais","duvidas"];

export default function WebhooksPage() {
  const [hooks, setHooks]     = useState([]);
  const [form, setForm]       = useState({ channelName:"", url:"", name:"" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHooks(); }, []);

  const fetchHooks = async () => {
    setLoading(true);
    try { const res = await api.get("/api/webhooks"); setHooks(res.data || []); }
    catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.channelName || !form.url) return setError("Canal e URL são obrigatórios");
    setSaving(true); setError(null);
    try {
      await api.post("/api/webhooks", form);
      setSuccess("✅ Webhook cadastrado! Notificações deste canal agora usam webhook.");
      setForm({ channelName:"", url:"", name:"" });
      fetchHooks();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este webhook?")) return;
    await api.delete(`/api/webhooks/${id}`);
    fetchHooks();
  };

  const toggleActive = async (id, active) => {
    await api.put(`/api/webhooks/${id}`, { active: !active });
    fetchHooks();
  };

  return (
    <div className={styles.page}>
      <div className={styles.info}>
        <h3>🔗 O que são Webhooks?</h3>
        <p>Webhooks permitem que o sistema envie mensagens no Discord <strong>independentemente do bot estar online</strong>. São mais estáveis e não dependem do token do bot.</p>
        <p>Para criar um webhook: Discord → Canal → ⚙️ Configurações → Integrações → Webhooks → Novo Webhook → Copiar URL.</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.formCard}>
          <h2 className={styles.title}>➕ Novo Webhook</h2>
          {error   && <div className={styles.error}>⚠️ {error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Canal do Discord *</label>
              <input type="text" value={form.channelName}
                onChange={(e) => setForm((p) => ({...p, channelName: e.target.value.toLowerCase().replace(/\s/g,"-"), name: p.name || e.target.value}))}
                placeholder="Ex: agenda" list="channels-list" required />
              <datalist id="channels-list">
                {COMMON_CHANNELS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className={styles.field}>
              <label>URL do Webhook *</label>
              <input type="url" value={form.url}
                onChange={(e) => setForm((p) => ({...p, url: e.target.value}))}
                placeholder="https://discord.com/api/webhooks/..." required />
            </div>
            <div className={styles.field}>
              <label>Nome (opcional)</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm((p) => ({...p, name: e.target.value}))}
                placeholder="Ex: Webhook Agenda" />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Salvando..." : "✅ Cadastrar Webhook"}
            </button>
          </form>
        </div>

        <div className={styles.listSection}>
          <h3 className={styles.listTitle}>
            Webhooks Cadastrados
            <span className={styles.count}>{hooks.length}</span>
          </h3>
          {loading ? <p className={styles.empty}>Carregando...</p>
          : hooks.length === 0 ? (
            <div className={styles.empty}>
              <span>🔗</span>
              <p>Nenhum webhook cadastrado.</p>
              <p>Sem webhooks, o sistema usa o token do bot automaticamente.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {hooks.map((h) => (
                <div key={h._id} className={`${styles.card} ${!h.active ? styles.inactive : ""}`}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.cardName}>{h.name || h.channelName}</span>
                      <span className={styles.cardChannel}>#{h.channelName}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={`${styles.toggleBtn} ${h.active ? styles.active : ""}`}
                        onClick={() => toggleActive(h._id, h.active)}>
                        {h.active ? "✅ Ativo" : "⭕ Inativo"}
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(h._id)}>🗑️</button>
                    </div>
                  </div>
                  <p className={styles.cardUrl}>{h.url.replace(/\/[^\/]+\/[^\/]+$/, "/***")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
