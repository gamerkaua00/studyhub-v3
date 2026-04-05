// StudyHub v3 — GalleryPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { galleryApi, subjectApi } from "../utils/api";
import { format } from "date-fns";
import styles from "./GalleryPage.module.css";

const EMPTY = { subject: "", date: format(new Date(), "yyyy-MM-dd"), title: "", description: "" };

export default function GalleryPage() {
  const [photos, setPhotos]       = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [filterSubject, setFilter] = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const fileRef                   = useRef();

  useEffect(() => { fetchPhotos(); fetchSubjects(); }, []);
  useEffect(() => { fetchPhotos(); }, [filterSubject]);

  const fetchPhotos = async () => {
    try {
      const params = filterSubject ? { subject: filterSubject } : {};
      const res = await galleryApi.getAll(params);
      setPhotos(res.data || []);
    } catch {}
  };
  const fetchSubjects = async () => {
    try { const res = await subjectApi.getAll(); setSubjects(res.data || []); } catch {}
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Selecione uma foto");
    if (!form.subject) return setError("Selecione a matéria");
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await galleryApi.upload(fd);
      setSuccess("✅ Foto enviada e publicada no Discord!");
      setForm(EMPTY); setFile(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchPhotos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta foto?")) return;
    try { await galleryApi.delete(id); fetchPhotos(); } catch {}
  };

  const uniqueSubjects = [...new Set(photos.map((p) => p.subject))].sort();

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>📷 Enviar Foto de Aula</h2>
        <p className={styles.subtitle}>A foto será enviada automaticamente no canal da matéria no Discord.</p>
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
            {preview ? (
              <img src={preview} alt="Preview" className={styles.preview} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <span className={styles.uploadIcon}>📸</span>
                <span>Clique para selecionar uma foto</span>
                <span className={styles.uploadHint}>JPG, PNG, WEBP — máx. 10MB</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className={styles.fileInput} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Matéria *</label>
              <select value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required>
                <option value="">Selecione...</option>
                {subjects.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Data da Aula *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Título (opcional)</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Aula 3 — Leis de Newton" maxLength={100} />
          </div>
          <div className={styles.field}>
            <label>Descrição (opcional)</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Tópico abordado..." maxLength={300} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={saving || !file}>
            {saving ? "Enviando..." : "📤 Enviar Foto"}
          </button>
        </form>
      </div>

      <div className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <h3 className={styles.listTitle}>Galeria de Aulas <span className={styles.count}>{photos.length}</span></h3>
          <select value={filterSubject} onChange={(e) => setFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">Todas as matérias</option>
            {uniqueSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {photos.length === 0 ? (
          <div className={styles.empty}><span>📭</span><p>Nenhuma foto cadastrada.</p></div>
        ) : (
          <div className={styles.grid}>
            {photos.map((photo) => (
              <div key={photo._id} className={styles.photoCard}>
                <img src={photo.imageUrl} alt={photo.title || photo.subject} className={styles.photo} loading="lazy" />
                <div className={styles.photoInfo}>
                  <span className={styles.photoSubject}>{photo.subject}</span>
                  <span className={styles.photoDate}>{photo.date?.split("-").reverse().join("/")}</span>
                </div>
                {photo.title && <p className={styles.photoTitle}>{photo.title}</p>}
                <button className={styles.deletePhotoBtn} onClick={() => handleDelete(photo._id)}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
