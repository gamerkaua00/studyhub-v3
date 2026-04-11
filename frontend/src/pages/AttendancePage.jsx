// StudyHub v3 — AttendancePage.jsx — múltiplos horários por matéria
import React, { useState, useEffect } from "react";
import { attendanceApi } from "../utils/api";
import styles from "./AttendancePage.module.css";

const DAYS  = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const EMPTY_SCHEDULE = { days: [], startTime: "08:00", endTime: "10:00", room: "", notes: "" };
const EMPTY_FORM = { subject: "", teacher: "", schedules: [{ ...EMPTY_SCHEDULE }] };

export default function AttendancePage() {
  const [list, setList]         = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    setLoading(true);
    try { const res = await attendanceApi.getAll(); setList(res.data || []); }
    catch { setError("Erro ao carregar."); }
    finally { setLoading(false); }
  };

  // Atualiza um campo de um horário específico
  const updateSchedule = (i, field, value) => {
    setForm((p) => {
      const schedules = [...p.schedules];
      schedules[i] = { ...schedules[i], [field]: value };
      return { ...p, schedules };
    });
  };

  const toggleDay = (i, day) => {
    const cur = form.schedules[i].days;
    updateSchedule(i, "days", cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]);
  };

  const addSchedule = () => setForm((p) => ({ ...p, schedules: [...p.schedules, { ...EMPTY_SCHEDULE }] }));
  const removeSchedule = (i) => setForm((p) => ({ ...p, schedules: p.schedules.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return setError("Matéria é obrigatória");
    if (!form.teacher.trim()) return setError("Professor é obrigatório");
    if (form.schedules.length === 0) return setError("Adicione ao menos um horário");
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = { ...form };
      // Compatibilidade: preenche campos legados com o primeiro horário
      if (form.schedules[0]) {
        payload.days      = form.schedules[0].days;
        payload.startTime = form.schedules[0].startTime;
        payload.endTime   = form.schedules[0].endTime;
        payload.room      = form.schedules[0].room;
        payload.notes     = form.schedules[0].notes;
      }
      if (editId) {
        await attendanceApi.update(editId, payload);
        setSuccess("✅ Atualizado! Painel reenviado no Discord.");
      } else {
        await attendanceApi.create(payload);
        setSuccess("✅ Criado! Canal criado no Discord.");
      }
      setEditId(null); setForm(EMPTY_FORM); fetchList();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const startEdit = (item) => {
    setEditId(item._id);
    const schedules = item.schedules?.length > 0
      ? item.schedules
      : [{ days: item.days || [], startTime: item.startTime || "08:00", endTime: item.endTime || "10:00", room: item.room || "", notes: item.notes || "" }];
    setForm({ subject: item.subject || "", teacher: item.teacher || "", schedules });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este atendimento?")) return;
    try { await attendanceApi.delete(id); fetchList(); } catch {}
  };

  const formatScheduleSummary = (item) => {
    const schedules = item.schedules?.length > 0
      ? item.schedules
      : [{ days: item.days || [], startTime: item.startTime, endTime: item.endTime }];
    return schedules.map((s, i) => `${s.days?.join(", ") || "—"}: ${s.startTime}–${s.endTime}`).join(" | ");
  };

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>{editId ? "✏️ Editar Atendimento" : "🏫 Novo Atendimento"}</h2>
        <p className={styles.subtitle}>
          {editId ? "Edite os dados. O Discord será atualizado automaticamente."
                  : "O bot criará um canal na categoria 🏫 Atendimento."}
        </p>

        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Matéria *</label>
              <input type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Ex: Física" required disabled={Boolean(editId)} />
              {editId && <span className={styles.hint}>Nome não pode mudar (é o canal no Discord)</span>}
            </div>
            <div className={styles.field}>
              <label>Professor *</label>
              <input type="text" value={form.teacher} onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
                placeholder="Nome do professor" required />
            </div>
          </div>

          {/* Horários */}
          <div className={styles.schedulesSection}>
            <div className={styles.schedulesHeader}>
              <span className={styles.schedulesTitle}>📅 Horários de Atendimento</span>
              <button type="button" className={styles.addScheduleBtn} onClick={addSchedule}>+ Adicionar horário</button>
            </div>

            {form.schedules.map((sched, i) => (
              <div key={i} className={styles.scheduleBlock}>
                <div className={styles.scheduleBlockHeader}>
                  <span className={styles.scheduleNum}>Horário {i + 1}</span>
                  {form.schedules.length > 1 && (
                    <button type="button" className={styles.removeScheduleBtn} onClick={() => removeSchedule(i)}>✕ Remover</button>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Dias</label>
                  <div className={styles.daysGrid}>
                    {DAYS.map((d) => (
                      <button type="button" key={d}
                        className={`${styles.dayBtn} ${sched.days.includes(d) ? styles.dayActive : ""}`}
                        onClick={() => toggleDay(i, d)}>{d}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}><label>Início</label><input type="time" value={sched.startTime} onChange={(e) => updateSchedule(i, "startTime", e.target.value)} /></div>
                  <div className={styles.field}><label>Fim</label><input type="time" value={sched.endTime} onChange={(e) => updateSchedule(i, "endTime", e.target.value)} /></div>
                  <div className={styles.field}><label>Sala</label><input type="text" value={sched.room} onChange={(e) => updateSchedule(i, "room", e.target.value)} placeholder="Lab 203" /></div>
                </div>

                <div className={styles.field}>
                  <label>Observações</label>
                  <input type="text" value={sched.notes} onChange={(e) => updateSchedule(i, "notes", e.target.value)} placeholder="Informações adicionais..." maxLength={200} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            {editId && <button type="button" className={styles.cancelBtn} onClick={() => { setEditId(null); setForm(EMPTY_FORM); setError(null); }}>Cancelar</button>}
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Salvando..." : editId ? "💾 Salvar" : "✅ Criar Atendimento"}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>Atendimentos <span className={styles.count}>{list.length}</span></h3>
        {loading ? <div className={styles.empty}>Carregando...</div>
        : list.length === 0 ? <div className={styles.empty}>Nenhum cadastrado ainda.</div>
        : (
          <div className={styles.grid}>
            {list.map((item) => (
              <div key={item._id} className={`${styles.card} ${editId === item._id ? styles.cardEditing : ""}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.subject}>📌 {item.subject}</span>
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => startEdit(item)}>✏️</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)}>🗑️</button>
                  </div>
                </div>
                <p className={styles.teacher}>👨‍🏫 {item.teacher}</p>
                <p className={styles.info}>🕐 {formatScheduleSummary(item)}</p>
                {(item.schedules?.length > 0 ? item.schedules : [item]).map((s, i) => (
                  s.room ? <p key={i} className={styles.info}>🏫 {s.room}{item.schedules?.length > 1 ? ` (Horário ${i+1})` : ""}</p> : null
                ))}
                <div className={styles.channelTag}>🔗 #{item.discordChannel}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
