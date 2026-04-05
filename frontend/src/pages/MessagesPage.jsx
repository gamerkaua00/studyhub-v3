// StudyHub v3 — MessagesPage.jsx
import React, { useState, useEffect } from "react";
import { messageApi } from "../utils/api";
import { format } from "date-fns";
import styles from "./MessagesPage.module.css";

const CHANNELS = ["agenda","avisos-gerais","conteudos","use-aqui","admin-bot"];
const COLORS   = ["#5865F2","#57F287","#FEE75C","#ED4245","#EB459E","#1ABC9C"];
const EMPTY    = { title: "", content: "", discordChannel: "avisos-gerais", date: format(new Date(),"yyyy-MM-dd"), time: "08:00", color: "#5865F2" };

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try { const res = await messageApi.getAll(); setMessages(res.data || []); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return setError("Conteúdo é obrigatório");
    setSaving(true); setError(null);
    try {
      await messageApi.create(form);
      setSuccess("✅ Mensagem programada!");
      setForm(EMPTY);
      fetchMessages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta mensagem programada?")) return;
    try { await messageApi.delete(id); fetchMessages(); } catch {}
  };

  const isPast = (date, time) => new Date(`${date}T${time}:00`) < new Date();

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>📢 Nova Mensagem Programada</h2>
        <p className={styles.subtitle}>A mensagem será enviada automaticamente no canal e horário escolhidos.</p>

        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Título (opcional)</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Aviso Importante" maxLength={100} />
          </div>
          <div className={styles.field}>
            <label>Mensagem *</label>
            <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Digite a mensagem que será enviada no Discord..." rows={4} maxLength={2000} required />
            <span className={styles.charCount}>{form.content.length}/2000</span>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Canal Discord *</label>
              <select value={form.discordChannel} onChange={(e) => setForm((p) => ({ ...p, discordChannel: e.target.value }))}>
                {CHANNELS.map((c) => <option key={c} value={c}>#{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Cor do Embed</label>
              <div className={styles.colorRow}>
                {COLORS.map((c) => (
                  <button type="button" key={c} className={`${styles.colorDot} ${form.color === c ? styles.selectedColor : ""}`} style={{ background: c }} onClick={() => setForm((p) => ({ ...p, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}><label>Data *</label><input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required /></div>
            <div className={styles.field}><label>Horário *</label><input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} required /></div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? "Salvando..." : "📅 Programar Mensagem"}</button>
        </form>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>Mensagens Programadas <span className={styles.count}>{messages.length}</span></h3>
        {messages.length === 0 ? (
          <div className={styles.empty}>Nenhuma mensagem programada.</div>
        ) : (
          <div className={styles.list}>
            {messages.map((msg) => (
              <div key={msg._id} className={`${styles.msgCard} ${msg.sent ? styles.sent : ""} ${isPast(msg.date, msg.time) && !msg.sent ? styles.overdue : ""}`} style={{ borderLeft: `4px solid ${msg.color}` }}>
                <div className={styles.msgHeader}>
                  <span className={styles.msgTitle}>{msg.title || "Sem título"}</span>
                  <span className={styles.msgChannel}>#{msg.discordChannel}</span>
                  {msg.sent && <span className={styles.sentBadge}>✅ Enviada</span>}
                  {isPast(msg.date, msg.time) && !msg.sent && <span className={styles.overdueBadge}>⚠️ Atrasada</span>}
                </div>
                <p className={styles.msgContent}>{msg.content}</p>
                <div className={styles.msgFooter}>
                  <span>📅 {msg.date?.split("-").reverse().join("/")} às {msg.time}</span>
                  {!msg.sent && <button className={styles.deleteBtn} onClick={() => handleDelete(msg._id)}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
