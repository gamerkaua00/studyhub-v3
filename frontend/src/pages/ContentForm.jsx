// StudyHub v3 — pages/ContentForm.jsx — REVISADO
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { contentApi, subjectApi, attendanceApi } from "../utils/api";
import styles from "./ContentForm.module.css";

const getPrefilledDate = () => {
  const d = sessionStorage.getItem("prefilledDate");
  if (d) { sessionStorage.removeItem("prefilledDate"); return d; }
  return format(new Date(), "yyyy-MM-dd");
};

const TYPE_OPTIONS = [
  { value: "Aula",         label: "📖 Aula",         channel: "conteudos"    },
  { value: "Revisão",      label: "🔄 Revisão",       channel: "conteudos"    },
  { value: "Prova",        label: "📝 Prova",         channel: "avisos-provas" },
  { value: "Apresentação", label: "🎤 Apresentação",  channel: "apresentacoes" },
  { value: "Atividade",    label: "📋 Atividade",     channel: "atividades"   },
  { value: "Avaliação",    label: "📊 Avaliação",     channel: "avaliacoes"   },
  { value: "Lista",        label: "📃 Lista",         channel: "listas"       },
];

const STATIC_CHANNELS = ["conteudos","avisos-provas","apresentacoes","atividades","avaliacoes","listas","agenda","materiais","duvidas","anuncios"];

const EMPTY = () => ({
  title:"", subject:"", type:"Aula",
  date: getPrefilledDate(),
  time:"08:00", discordChannel:"conteudos",
  resourceLink:"", description:"",
});

export default function ContentForm() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const [form, setForm]         = useState(EMPTY);
  const [subjects, setSubjects] = useState([]);
  const [allChannels, setAllChannels] = useState(STATIC_CHANNELS);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, attRes] = await Promise.all([
          subjectApi.getAll(),
          attendanceApi.getAll(),
        ]);
        setSubjects(subRes.data || []);
        // Adiciona canais de atendimento à lista
        const attChannels = (attRes.data || []).map((a) => a.discordChannel).filter(Boolean);
        setAllChannels([...new Set([...STATIC_CHANNELS, ...attChannels])]);

        if (isEdit) {
          const res = await contentApi.getById(id);
          const c   = res.data;
          setForm({
            title:          c.title          || "",
            subject:        c.subject        || "",
            type:           c.type           || "Aula",
            date:           c.date           || format(new Date(), "yyyy-MM-dd"),
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

  // Auto-preenche canal ao mudar tipo
  const handleTypeChange = (type) => {
    const typeOpt = TYPE_OPTIONS.find((t) => t.value === type);
    setForm((p) => ({ ...p, type, discordChannel: typeOpt?.channel || "conteudos" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())   return setError("Título é obrigatório");
    if (!form.subject.trim()) return setError("Matéria é obrigatória");
    setSaving(true); setError(null);
    try {
      if (isEdit) await contentApi.update(id, form);
      else        await contentApi.create(form);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loadingWrap}><span className={styles.spinner} /> Carregando...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>← Voltar</button>
          <div>
            <h2 className={styles.title}>{isEdit ? "✏️ Editar Conteúdo" : "➕ Novo Conteúdo"}</h2>
            <p className={styles.subtitle}>
              {isEdit ? "Edite e salve. A agenda no Discord será atualizada."
                      : "Preencha os dados. A notificação será enviada automaticamente."}
            </p>
          </div>
        </div>

        {success && <div className={styles.successMsg}>✅ {isEdit ? "Atualizado!" : "Criado!"} Redirecionando...</div>}
        {error   && <div className={styles.errorMsg}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Título *</label>
            <input type="text" name="title" value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Aula 3 — Leis de Newton" maxLength={200} required />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Matéria *</label>
              <input type="text" value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Ex: Física" list="subjects-list" required />
              <datalist id="subjects-list">
                {subjects.map((s) => <option key={s._id} value={s.name} />)}
              </datalist>
            </div>
            <div className={styles.field}>
              <label>Tipo *</label>
              <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Data *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label>Horário *</label>
              <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Canal do Discord</label>
            <select value={form.discordChannel} onChange={(e) => setForm((p) => ({ ...p, discordChannel: e.target.value }))}>
              {allChannels.map((c) => <option key={c} value={c}>#{c}</option>)}
            </select>
            <span className={styles.hint}>A agenda completa do mês será reenviada no #agenda automaticamente.</span>
          </div>

          <div className={styles.field}>
            <label>Link do Material</label>
            <input type="url" value={form.resourceLink}
              onChange={(e) => setForm((p) => ({ ...p, resourceLink: e.target.value }))}
              placeholder="https://drive.google.com/..." />
          </div>

          <div className={styles.field}>
            <label>Descrição</label>
            <textarea value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3} maxLength={1000} placeholder="Tópicos, observações..." />
            <span className={styles.charCount}>{form.description.length}/1000</span>
          </div>

          {(form.type === "Prova" || form.type === "Avaliação") && (
            <div className={styles.infoBox}>
              📢 Notificações automáticas: enquete 3 dias antes às 19h • aviso às 08h e 17h do dia anterior • notificação no horário
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <><span className={styles.spinnerSm} /> Salvando...</> : isEdit ? "💾 Salvar" : "✅ Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
