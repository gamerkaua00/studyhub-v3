// StudyHub v3 — pages/ContentForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { contentApi, subjectApi } from "../utils/api";
import styles from "./ContentForm.module.css";

// BUG FIX: Lê a data pré-preenchida do sessionStorage ao clicar no calendário
const getPrefilledDate = () => {
  const d = sessionStorage.getItem("prefilledDate");
  if (d) {
    sessionStorage.removeItem("prefilledDate"); // limpa após usar
    return d;
  }
  return format(new Date(), "yyyy-MM-dd");
};

const EMPTY_FORM = {
  title:          "",
  subject:        "",
  type:           "Aula",
  date:           getPrefilledDate(),
  time:           "08:00",
  discordChannel: "conteudos",
  resourceLink:   "",
  description:    "",
};

const TYPE_OPTIONS = [
  { value: "Aula",         label: "📖 Aula"         },
  { value: "Revisão",      label: "🔄 Revisão"       },
  { value: "Prova",        label: "📝 Prova"         },
  { value: "Apresentação", label: "🎤 Apresentação"  },
  { value: "Atividade",    label: "📋 Atividade"     },
  { value: "Avaliação",    label: "📊 Avaliação"     },
  { value: "Lista",        label: "📃 Lista"         },
];

const CHANNEL_OPTIONS = ["conteudos","agenda","avisos-provas","avaliacoes","listas","apresentacoes","atividades","use-aqui","geral"];

export default function ContentForm() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const isEdit      = Boolean(id);

  const [form, setForm]         = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const subRes = await subjectApi.getAll();
        setSubjects(subRes.data || []);
        if (isEdit) {
          const res = await contentApi.getById(id);
          const c   = res.data;
          setForm({
            title:          c.title          || "",
            subject:        c.subject        || "",
            type:           c.type           || "Aula",
            date:           c.date           || EMPTY_FORM.date,
            time:           c.time           || "08:00",
            discordChannel: c.discordChannel || "conteudos",
            resourceLink:   c.resourceLink   || "",
            description:    c.description    || "",
          });
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!form.title.trim())   { setSaving(false); return setError("Título é obrigatório"); }
    if (!form.subject.trim()) { setSaving(false); return setError("Matéria é obrigatória"); }
    try {
      if (isEdit) { await contentApi.update(id, form); }
      else        { await contentApi.create(form); }
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loadingWrap}><span className={styles.spinner} />Carregando...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>← Voltar</button>
          <div>
            <h2 className={styles.title}>{isEdit ? "✏️ Editar Conteúdo" : "➕ Novo Conteúdo"}</h2>
            <p className={styles.subtitle}>{isEdit ? "Altere os campos e salve." : "Preencha os dados. A agenda será atualizada automaticamente no Discord."}</p>
          </div>
        </div>

        {success && <div className={styles.successMsg}>✅ {isEdit ? "Atualizado!" : "Criado!"} Redirecionando...</div>}
        {error   && <div className={styles.errorMsg}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">Título *</label>
            <input id="title" name="title" type="text" value={form.title} onChange={handleChange} placeholder="Ex: Aula 3 — Leis de Newton" maxLength={200} required />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="subject">Matéria *</label>
              <input id="subject" name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="Ex: Física" list="subjects-list" required />
              <datalist id="subjects-list">{subjects.map((s) => <option key={s._id} value={s.name} />)}</datalist>
            </div>
            <div className={styles.field}>
              <label htmlFor="type">Tipo *</label>
              <select id="type" name="type" value={form.type} onChange={handleChange}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="date">Data *</label>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="time">Horário *</label>
              <input id="time" name="time" type="time" value={form.time} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="discordChannel">Canal do Discord *</label>
            <select id="discordChannel" name="discordChannel" value={form.discordChannel} onChange={handleChange}>
              {CHANNEL_OPTIONS.map((c) => <option key={c} value={c}>#{c}</option>)}
            </select>
            <span className={styles.hint}>A agenda completa do mês será reenviada no #agenda automaticamente.</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="resourceLink">Link do Material (opcional)</label>
            <input id="resourceLink" name="resourceLink" type="url" value={form.resourceLink} onChange={handleChange} placeholder="https://drive.google.com/..." />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Descrição (opcional)</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} maxLength={1000} />
            <span className={styles.charCount}>{form.description.length}/1000</span>
          </div>

          {(form.type === "Prova" || form.type === "Avaliação") && (
            <div className={styles.infoBox}>
              📢 <strong>Notificações automáticas:</strong>
              <ul>
                <li>☀️ 1 dia antes às 08:00 → aviso antecipado</li>
                <li>📊 3 dias antes às 19:00 → enquete de estudos</li>
                <li>📝 No dia e horário → lembrete final</li>
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <><span className={styles.spinnerSm} /> Salvando...</> : isEdit ? "💾 Salvar Alterações" : "✅ Criar Conteúdo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
