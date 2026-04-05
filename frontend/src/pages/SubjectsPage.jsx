// ============================================================
// StudyHub — pages/SubjectsPage.jsx
// Gerenciamento de matérias e suas cores para o calendário
// ============================================================

import React, { useState, useEffect } from "react";
import { subjectApi } from "../utils/api";
import styles from "./SubjectsPage.module.css";

// Paleta pré-definida de cores (estilo Discord)
const COLOR_PALETTE = [
  "#5865F2", "#57F287", "#FEE75C", "#EB459E",
  "#ED4245", "#2D7D46", "#1ABC9C", "#3498DB",
  "#E67E22", "#9B59B6", "#00BCD4", "#FF5722",
  "#607D8B", "#795548", "#F06292", "#AED581",
];

const EMOJI_OPTIONS = [
  "📚","🔬","🧮","⚗️","🌍","📐","📊","🖥️",
  "🎭","🎵","🏛️","✍️","🧠","💡","🔭","📝",
];

const EMPTY_FORM = { name: "", color: "#5865F2", emoji: "📚" };

export default function SubjectsPage() {
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);

  // Busca matérias ao montar
  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getAll();
      setSubjects(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Iniciar edição ─────────────────────────────────────────
  const startEdit = (subject) => {
    setEditingId(subject._id);
    setForm({ name: subject.name, color: subject.color, emoji: subject.emoji });
    setFormError(null);
  };

  // ── Cancelar edição ────────────────────────────────────────
  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  // ── Salvar (criar ou editar) ────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Nome é obrigatório");
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await subjectApi.update(editingId, { color: form.color, emoji: form.emoji });
      } else {
        await subjectApi.create(form);
      }
      await fetchSubjects();
      cancelEdit();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir matéria ────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!confirm(`Excluir a matéria "${name}"?\nOs conteúdos desta matéria não serão excluídos.`)) return;
    try {
      await subjectApi.delete(id);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Painel de criação/edição ─────────────────────── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>
          {editingId ? "✏️ Editar Matéria" : "➕ Nova Matéria"}
        </h3>

        {formError && (
          <div className={styles.formError}>⚠️ {formError}</div>
        )}

        <form onSubmit={handleSave} className={styles.form}>
          {/* Nome (desabilitado na edição) */}
          <div className={styles.field}>
            <label>Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Física Quântica"
              disabled={Boolean(editingId)}
              maxLength={100}
              required
            />
            {editingId && (
              <span className={styles.hint}>O nome não pode ser alterado após criação.</span>
            )}
          </div>

          {/* Emoji */}
          <div className={styles.field}>
            <label>Ícone</label>
            <div className={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`${styles.emojiBtn} ${form.emoji === em ? styles.selectedEmoji : ""}`}
                  onClick={() => setForm((p) => ({ ...p, emoji: em }))}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className={styles.field}>
            <label>Cor no Calendário</label>
            <div className={styles.colorPalette}>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${form.color === c ? styles.selectedColor : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  title={c}
                />
              ))}
            </div>
            {/* Input manual para cor customizada */}
            <div className={styles.customColor}>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className={styles.colorInput}
                title="Cor personalizada"
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                    setForm((p) => ({ ...p, color: v }));
                  }
                }}
                className={styles.colorHex}
                maxLength={7}
                spellCheck={false}
              />
              {/* Preview */}
              <div
                className={styles.colorPreview}
                style={{ background: form.color }}
              >
                {form.emoji} {form.name || "Exemplo"}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className={styles.formActions}>
            {editingId && (
              <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Salvando..." : editingId ? "💾 Salvar" : "✅ Criar Matéria"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Lista de matérias ─────────────────────────────── */}
      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>
          Matérias Cadastradas
          <span className={styles.count}>{subjects.length}</span>
        </h3>

        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} /> Carregando...
          </div>
        ) : error ? (
          <div className={styles.error}>⚠️ {error}</div>
        ) : subjects.length === 0 ? (
          <div className={styles.empty}>
            Nenhuma matéria cadastrada ainda.
          </div>
        ) : (
          <div className={styles.grid}>
            {subjects.map((s) => (
              <div
                key={s._id}
                className={`${styles.subjectCard} ${editingId === s._id ? styles.editing : ""}`}
                style={{ borderLeft: `4px solid ${s.color}` }}
              >
                <div className={styles.subjectMain}>
                  <span className={styles.subjectEmoji}>{s.emoji}</span>
                  <div className={styles.subjectInfo}>
                    <span className={styles.subjectName}>{s.name}</span>
                    <span
                      className={styles.subjectColor}
                      style={{ color: s.color }}
                    >
                      {s.color}
                    </span>
                  </div>
                  <div
                    className={styles.colorDot}
                    style={{ background: s.color }}
                  />
                </div>
                <div className={styles.subjectActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => startEdit(s)}
                    title="Editar cor/ícone"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(s._id, s.name)}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
