// StudyHub v3 — AttendancePage.jsx
import React, { useState, useEffect } from "react";
import { attendanceApi } from "../utils/api";
import styles from "./AttendancePage.module.css";

const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const EMPTY = { subject:"", teacher:"", room:"", days:[], startTime:"08:00", endTime:"10:00", notes:"" };

export default function AttendancePage() {
  const [list, setList]     = useState([]);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    try { const res = await attendanceApi.getAll(); setList(res.data || []); } catch {}
  };

  const toggleDay = (day) => {
    setForm((p) => ({ ...p, days: p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.teacher) return setError("Matéria e professor são obrigatórios");
    setSaving(true); setError(null);
    try {
      if (editId) { await attendanceApi.update(editId, form); setEditId(null); }
      else { await attendanceApi.create(form); }
      setForm(EMPTY);
      fetchList();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este atendimento?")) return;
    try { await attendanceApi.delete(id); fetchList(); } catch {}
  };

  const startEdit = (item) => {
    setEditId(item._id);
    setForm({ subject: item.subject, teacher: item.teacher, room: item.room || "", days: item.days || [], startTime: item.startTime, endTime: item.endTime, notes: item.notes || "" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>🏫 {editId ? "Editar" : "Novo"} Atendimento</h2>
        <p className={styles.subtitle}>O bot criará automaticamente um canal dedicado para cada matéria na categoria **🏫 Atendimento**.</p>
        {error && <div className={styles.error}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}><label>Matéria *</label><input type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Ex: Física" required disabled={Boolean(editId)} /></div>
            <div className={styles.field}><label>Professor *</label><input type="text" value={form.teacher} onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))} placeholder="Nome do professor" required /></div>
          </div>
          <div className={styles.field}><label>Sala</label><input type="text" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="Ex: Lab 203, Sala 15" /></div>
          <div className={styles.field}>
            <label>Dias de Atendimento</label>
            <div className={styles.daysGrid}>
              {DAYS.map((d) => (
                <button type="button" key={d} className={`${styles.dayBtn} ${form.days.includes(d) ? styles.dayActive : ""}`} onClick={() => toggleDay(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}><label>Início</label><input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} /></div>
            <div className={styles.field}><label>Fim</label><input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} /></div>
          </div>
          <div className={styles.field}><label>Observações</label><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Informações adicionais..." /></div>
          <div className={styles.actions}>
            {editId && <button type="button" className={styles.cancelBtn} onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancelar</button>}
            <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? "Salvando..." : editId ? "💾 Salvar" : "✅ Criar Atendimento"}</button>
          </div>
        </form>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>Atendimentos Cadastrados <span className={styles.count}>{list.length}</span></h3>
        {list.length === 0 ? <div className={styles.empty}>Nenhum atendimento cadastrado.</div> : (
          <div className={styles.grid}>
            {list.map((item) => (
              <div key={item._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.subject}>📌 {item.subject}</span>
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => startEdit(item)}>✏️</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)}>🗑️</button>
                  </div>
                </div>
                <p className={styles.teacher}>👨‍🏫 {item.teacher}</p>
                {item.room && <p className={styles.info}>🏫 {item.room}</p>}
                {item.days?.length > 0 && <p className={styles.info}>📅 {item.days.join(", ")}</p>}
                <p className={styles.info}>🕐 {item.startTime} — {item.endTime}</p>
                {item.notes && <p className={styles.notes}>{item.notes}</p>}
                <span className={styles.channel}>Canal: #{item.discordChannel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
