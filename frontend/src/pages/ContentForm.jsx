// ============================================================
// StudyHub — pages/ContentForm.jsx
// Formulário de criação e edição de conteúdos de estudo
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { contentApi, subjectApi } from "../utils/api";
import styles from "./ContentForm.module.css";

const EMPTY_FORM = {
  title:          "",
  subject:        "",
  type:           "Aula",
  date:           sessionStorage.getItem("prefilledDate") || format(new Date(), "yyyy-MM-dd"),
  time:           "08:00",
  discordChannel: "conteudos",
  resourceLink:   "",
  description:    "",
};

const TYPE_OPTIONS = [
  { value: "Aula",         label: "📖 Aula" },
  { value: "Revisão",      label: "🔄 Revisão" },
  { value: "Prova",        label: "📝 Prova" },
  { value: "Apresentação", label: "🎤 Apresentação" },
  { value: "Atividade",    label: "📋 Atividade" },
  { value: "Avaliação",    label: "📊 Avaliação" },
  { value: "Lista",        label: "📃 Lista" },
];

const CHANNEL_OPTIONS = ["conteudos", "agenda", "avisos-provas", "geral"];

export default function ContentForm() {
  const navigate    = useNavigate();
  const { id }      = useParams(); // Se há ID → modo edição
  const isEdit      = Boolean(id);

  const [form, setForm]         = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  // ── Carrega dados do conteúdo em modo edição ───────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Busca matérias para o select
        const subRes = await subjectApi.getAll();
        setSubjects(subRes.data || []);

        // Se edição, carrega o conteúdo
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  // ── Atualiza campo do formulário ────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // ── Submete o formulário ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validações básicas no cliente
    if (!form.title.trim())   return setError("Título é obrigatório"), setSaving(false);
    if (!form.subject.trim()) return setError("Matéria é obrigatória"), setSaving(false);
    if (!form.date)           return setError("Data é obrigatória"),    setSaving(false);
    if (!form.time)           return setError("Horário é obrigatório"), setSaving(false);

    try {
      if (isEdit) {
        await contentApi.update(id, form);
      } else {
        await contentApi.create(form);
      }
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <span className={styles.spinner} />
        Carregando...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            ← Voltar
          </button>
          <div>
            <h2 className={styles.title}>
              {isEdit ? "✏️ Editar Conteúdo" : "➕ Novo Conteúdo"}
            </h2>
            <p className={styles.subtitle}>
              {isEdit
                ? "Altere os campos e salve as mudanças."
                : "Preencha os dados e o bot notificará automaticamente no horário."}
            </p>
          </div>
        </div>

        {/* Feedback de sucesso */}
        {success && (
          <div className={styles.successMsg}>
            ✅ {isEdit ? "Conteúdo atualizado!" : "Conteúdo criado!"} Redirecionando...
          </div>
        )}

        {/* Feedback de erro */}
        {error && (
          <div className={styles.errorMsg}>⚠️ {error}</div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Título */}
          <div className={styles.field}>
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex: Aula 3 — Leis de Newton"
              maxLength={200}
              required
            />
          </div>

          {/* Matéria + Tipo (linha) */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="subject">Matéria *</label>
              {/* Input com datalist para sugerir matérias cadastradas */}
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="Ex: Física, Matemática..."
                list="subjects-list"
                required
              />
              <datalist id="subjects-list">
                {subjects.map((s) => (
                  <option key={s._id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className={styles.field}>
              <label htmlFor="type">Tipo *</label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data + Hora (linha) */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="date">Data *</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="time">Horário *</label>
              <input
                id="time"
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Canal Discord */}
          <div className={styles.field}>
            <label htmlFor="discordChannel">Canal do Discord *</label>
            <select
              id="discordChannel"
              name="discordChannel"
              value={form.discordChannel}
              onChange={handleChange}
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>#{c}</option>
              ))}
            </select>
            <span className={styles.hint}>
              A notificação será enviada neste canal automaticamente no horário.
            </span>
          </div>

          {/* Link de material */}
          <div className={styles.field}>
            <label htmlFor="resourceLink">Link do Material (opcional)</label>
            <input
              id="resourceLink"
              name="resourceLink"
              type="url"
              value={form.resourceLink}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Descrição */}
          <div className={styles.field}>
            <label htmlFor="description">Descrição (opcional)</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Observações, tópicos abordados, material necessário..."
              rows={3}
              maxLength={1000}
            />
            <span className={styles.charCount}>
              {form.description.length}/1000
            </span>
          </div>

          {/* Info de notificação automática */}
          {form.type === "Prova" && (
            <div className={styles.infoBox}>
              📢 <strong>Notificações automáticas para Provas:</strong>
              <ul>
                <li>☀️ Um dia antes às 08:00 → aviso no canal selecionado</li>
                <li>📝 No dia e horário cadastrado → lembrete de prova</li>
              </ul>
            </div>
          )}

          {/* Ações */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={saving}
            >
              {saving ? (
                <><span className={styles.spinnerSm} /> Salvando...</>
              ) : isEdit ? (
                "💾 Salvar Alterações"
              ) : (
                "✅ Criar Conteúdo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
