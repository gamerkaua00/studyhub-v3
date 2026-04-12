// StudyHub v3.1.1 — GalleryPage.jsx — MÚLTIPLAS IMAGENS
import React, { useState, useEffect, useRef } from "react";
import { galleryApi, subjectApi } from "../utils/api";
import { format } from "date-fns";
import styles from "./GalleryPage.module.css";

const PHOTO_TYPES = [
  { value:"aula",         label:"📖 Aula"         },
  { value:"prova",        label:"📝 Prova"         },
  { value:"atividade",    label:"📋 Atividade"     },
  { value:"avaliacao",    label:"📊 Avaliação"     },
  { value:"apresentacao", label:"🎤 Apresentação"  },
  { value:"lista",        label:"📃 Lista"         },
  { value:"outro",        label:"📁 Outro"         },
];
const EMPTY = { subject:"", date:format(new Date(),"yyyy-MM-dd"), title:"", description:"", photoType:"aula" };

export default function GalleryPage() {
  const [photos, setPhotos]     = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [files, setFiles]       = useState([]); // múltiplos arquivos
  const [previews, setPreviews] = useState([]);
  const [filterSub, setFilter]  = useState("");
  const [saving, setSaving]     = useState(false);
  const [progress, setProgress] = useState(""); // "3/5 fotos enviadas..."
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);
  const fileRef                 = useRef();

  useEffect(() => { fetchPhotos(); fetchSubjects(); }, []);
  useEffect(() => { fetchPhotos(); }, [filterSub]);

  const fetchPhotos = async () => {
    try { const res = await galleryApi.getAll(filterSub ? { subject: filterSub } : {}); setPhotos(res.data || []); } catch {}
  };
  const fetchSubjects = async () => {
    try { const res = await subjectApi.getAll(); setSubjects(res.data || []); } catch {}
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;
    setFiles(picked);
    const readers = picked.map((f) => new Promise((res) => {
      const r = new FileReader();
      r.onload = (ev) => res(ev.target.result);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(setPreviews);
  };

  const removeFile = (i) => {
    setFiles((p) => p.filter((_,idx) => idx !== i));
    setPreviews((p) => p.filter((_,idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length)   return setError("Selecione ao menos uma foto");
    if (!form.subject)   return setError("Selecione a matéria");
    setSaving(true); setError(null); setProgress(`Enviando ${files.length} foto(s)...`);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("photos", f)); // campo 'photos' (array)
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      const res = await galleryApi.upload(fd);
      setSuccess(`✅ ${res.count} foto(s) enviada(s) ao Discord!`);
      setForm(EMPTY); setFiles([]); setPreviews([]);
      if (fileRef.current) fileRef.current.value = "";
      fetchPhotos();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); setProgress(""); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta foto?")) return;
    try { await galleryApi.delete(id); fetchPhotos(); } catch {}
  };

  const uniqueSubs = [...new Set(photos.map((p) => p.subject))].sort();

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>📷 Enviar Fotos de Aula</h2>
        <p className={styles.subtitle}>Selecione uma ou várias fotos de uma vez. Útil para listas com várias páginas!</p>

        {error    && <div className={styles.error}>⚠️ {error}</div>}
        {success  && <div className={styles.success}>{success}</div>}
        {progress && <div className={styles.progress}>⏳ {progress}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Área de upload */}
          <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
            {previews.length === 0 ? (
              <div className={styles.uploadPlaceholder}>
                <span className={styles.uploadIcon}>📸</span>
                <span>Clique para selecionar foto(s)</span>
                <span className={styles.uploadHint}>JPG, PNG, WEBP — até 10 fotos por vez, 10MB cada</span>
              </div>
            ) : (
              <div className={styles.previewGrid}>
                {previews.map((src, i) => (
                  <div key={i} className={styles.previewItem}>
                    <img src={src} alt={`Foto ${i+1}`} className={styles.previewImg} />
                    <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeFile(i); }}>✕</button>
                    <span className={styles.previewNum}>{i+1}</span>
                  </div>
                ))}
                <div className={styles.addMoreBtn} onClick={() => fileRef.current.click()}>+ Adicionar</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className={styles.fileInput} />
          </div>

          {files.length > 0 && (
            <div className={styles.filesCount}>📎 {files.length} foto(s) selecionada(s)</div>
          )}

          {/* Tipo */}
          <div className={styles.field}>
            <label>Tipo do Conteúdo *</label>
            <div className={styles.typeGrid}>
              {PHOTO_TYPES.map((t) => (
                <button type="button" key={t.value}
                  className={`${styles.typeBtn} ${form.photoType === t.value ? styles.typeActive : ""}`}
                  onClick={() => setForm((p) => ({ ...p, photoType: t.value }))}>
                  {t.label}
                </button>
              ))}
            </div>
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
              <label>Data *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Título (opcional)</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Aula 3 — Leis de Newton" maxLength={100} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={saving || !files.length}>
            {saving ? `${progress || "Enviando..."}` : `📤 Enviar ${files.length > 1 ? `${files.length} Fotos` : "Foto"}`}
          </button>
        </form>
      </div>

      <div className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <h3 className={styles.listTitle}>Galeria <span className={styles.count}>{photos.length}</span></h3>
          <select value={filterSub} onChange={(e) => setFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">Todas as matérias</option>
            {uniqueSubs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {photos.length === 0 ? (
          <div className={styles.empty}><span>📭</span><p>Nenhuma foto cadastrada.</p></div>
        ) : (
          <div className={styles.grid}>
            {photos.map((photo) => (
              <div key={photo._id} className={styles.photoCard}>
                <img src={photo.imageUrl} alt={photo.title||photo.subject} className={styles.photo} loading="lazy" />
                <div className={styles.photoInfo}>
                  <span className={styles.photoSubject}>{photo.subject}</span>
                  <span className={styles.photoDate}>{photo.date?.split("-").reverse().join("/")}</span>
                </div>
                {photo.photoType && <span className={styles.photoType}>{PHOTO_TYPES.find((t) => t.value===photo.photoType)?.label||photo.photoType}</span>}
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
