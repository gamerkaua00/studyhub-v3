// StudyHub v3.1.2 — FaultsPage.jsx — Controle de faltas
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../utils/api";
import styles from "./FaultsPage.module.css";

const LIMIT = 20;
const EMPTY = { studentName:"", subject:"", date:format(new Date(),"yyyy-MM-dd"), note:"", justified:false };

export default function FaultsPage() {
  const [summary, setSummary] = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [filter, setFilter]   = useState({ student:"", subject:"" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("add"); // add | summary

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try { const res = await api.get("/api/faults/summary"); setSummary(res.data || []); }
    catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentName || !form.subject) return setError("Nome e matéria são obrigatórios");
    setSaving(true); setError(null);
    try {
      const res = await api.post("/api/faults", form);
      let msg = `✅ Falta registrada! Total: ${res.totalFaults} faltas`;
      if (res.warning) msg += `\n⚠️ ${res.warning}`;
      setSuccess(msg);
      setForm(EMPTY);
      fetchSummary();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover esta falta?")) return;
    await api.delete(`/api/faults/${id}`);
    fetchSummary();
  };

  const filtered = summary.filter((s) => {
    const byStudent = filter.student ? s.student.toLowerCase().includes(filter.student.toLowerCase()) : true;
    const bySubject = filter.subject ? s.subject.toLowerCase().includes(filter.subject.toLowerCase()) : true;
    return byStudent && bySubject;
  }).sort((a, b) => b.unexcused - a.unexcused);

  const atRisk    = filtered.filter((s) => s.unexcused >= 15);
  const atLimit   = filtered.filter((s) => s.atLimit);

  return (
    <div className={styles.page}>
      <div className={styles.topStats}>
        <div className={styles.statCard} style={{ borderTopColor:"#ED4245" }}>
          <span className={styles.statNum}>{atLimit.length}</span>
          <span className={styles.statLabel}>🔴 No limite (20+)</span>
        </div>
        <div className={styles.statCard} style={{ borderTopColor:"#FEE75C" }}>
          <span className={styles.statNum}>{atRisk.length}</span>
          <span className={styles.statLabel}>🟠 Em risco (15+)</span>
        </div>
        <div className={styles.statCard} style={{ borderTopColor:"#57F287" }}>
          <span className={styles.statNum}>{filtered.length}</span>
          <span className={styles.statLabel}>📊 Registros totais</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==="add" ? styles.tabActive : ""}`} onClick={() => setTab("add")}>➕ Registrar Falta</button>
        <button className={`${styles.tab} ${tab==="summary" ? styles.tabActive : ""}`} onClick={() => setTab("summary")}>📊 Resumo</button>
      </div>

      {tab === "add" ? (
        <div className={styles.formCard}>
          {error   && <div className={styles.error}>⚠️ {error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Nome do Aluno *</label>
                <input type="text" value={form.studentName} onChange={(e) => setForm((p) => ({...p, studentName:e.target.value}))} placeholder="Ex: João Silva" required />
              </div>
              <div className={styles.field}>
                <label>Matéria *</label>
                <input type="text" value={form.subject} onChange={(e) => setForm((p) => ({...p, subject:e.target.value}))} placeholder="Ex: Matemática" required />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Data *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((p) => ({...p, date:e.target.value}))} required />
              </div>
              <div className={styles.field}>
                <label>Observação</label>
                <input type="text" value={form.note} onChange={(e) => setForm((p) => ({...p, note:e.target.value}))} placeholder="Opcional" />
              </div>
            </div>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.justified} onChange={(e) => setForm((p) => ({...p, justified:e.target.checked}))} />
              Falta justificada (não conta para o limite)
            </label>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Salvando..." : "✅ Registrar Falta"}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.summarySection}>
          <div className={styles.filters}>
            <input type="text" placeholder="Filtrar por aluno..." value={filter.student} onChange={(e) => setFilter((p) => ({...p, student:e.target.value}))} className={styles.filterInput} />
            <input type="text" placeholder="Filtrar por matéria..." value={filter.subject} onChange={(e) => setFilter((p) => ({...p, subject:e.target.value}))} className={styles.filterInput} />
          </div>

          {loading ? <p className={styles.empty}>Carregando...</p>
          : filtered.length === 0 ? <p className={styles.empty}>Nenhum registro encontrado.</p>
          : (
            <div className={styles.summaryList}>
              {filtered.map((s, i) => {
                const pct = Math.min(Math.round((s.unexcused / LIMIT) * 100), 100);
                const barColor = s.atLimit ? "#ED4245" : s.pct >= 75 ? "#FEE75C" : "#57F287";
                return (
                  <div key={i} className={`${styles.summaryCard} ${s.atLimit ? styles.atLimit : ""}`}>
                    <div className={styles.summaryHeader}>
                      <div>
                        <p className={styles.summaryName}>{s.student}</p>
                        <p className={styles.summarySubject}>📌 {s.subject}</p>
                      </div>
                      <div className={styles.faultCount}>
                        <span className={styles.faultNum} style={{ color: barColor }}>{s.unexcused}</span>
                        <span className={styles.faultDenom}>/{LIMIT}</span>
                      </div>
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width:`${pct}%`, background:barColor }} />
                    </div>
                    <div className={styles.summaryFooter}>
                      <span>{s.unexcused} injustificada(s) · {s.justified} justificada(s)</span>
                      {s.atLimit && <span className={styles.limitBadge}>🚨 LIMITE ATINGIDO</span>}
                      {!s.atLimit && s.pct >= 75 && <span className={styles.warnBadge}>⚠️ EM RISCO</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
