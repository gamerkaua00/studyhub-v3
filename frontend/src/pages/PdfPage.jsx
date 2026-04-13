// StudyHub v3.1.3 — PdfPage.jsx
import React, { useState, useRef } from "react";
import styles from "./PdfPage.module.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function PdfPage() {
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mode, setMode]       = useState("single");
  const [title, setTitle]     = useState("");
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError]     = useState(null);
  const fileRef               = useRef();

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;
    setFiles(picked); setResults([]); setError(null);
    Promise.all(picked.map((f) => new Promise((res) => {
      const r = new FileReader();
      r.onload = (ev) => res(ev.target.result);
      r.readAsDataURL(f);
    }))).then(setPreviews);
  };

  const removeFile = (i) => {
    setFiles((p) => p.filter((_,idx) => idx !== i));
    setPreviews((p) => p.filter((_,idx) => idx !== i));
  };

  const handleConvert = async () => {
    if (!files.length) return setError("Selecione ao menos uma imagem");
    setConverting(true); setError(null); setResults([]);
    try {
      const token = localStorage.getItem("studyhub_token");
      const fd    = new FormData();
      files.forEach((f) => fd.append("images", f));
      fd.append("mode",  mode);
      fd.append("title", title || "documento");

      if (mode === "single") {
        // Usa fetch diretamente para controlar responseType
        const resp = await fetch(`${BASE_URL}/api/pdf/convert`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: `Erro ${resp.status}` }));
          throw new Error(err.message || `Erro ${resp.status}`);
        }
        const blob = await resp.blob();
        const url  = URL.createObjectURL(blob);
        const name = `${title || "documento"}.pdf`;
        setResults([{ url, name }]);
      } else {
        const resp = await fetch(`${BASE_URL}/api/pdf/convert`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: `Erro ${resp.status}` }));
          throw new Error(err.message || `Erro ${resp.status}`);
        }
        const data = await resp.json();
        const pdfs = (data.pdfs || []).map((p) => {
          const bytes = atob(p.data);
          const arr   = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const url   = URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
          return { url, name: p.name };
        });
        setResults(pdfs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>📄 Converter Imagens para PDF</h2>
        <p className={styles.subtitle}>
          Ideal para listas, exercícios e materiais com várias páginas. Use arquivos <strong>JPG ou PNG</strong>.
        </p>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        {/* Upload */}
        <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
          {previews.length === 0 ? (
            <div className={styles.placeholder}>
              <span>🖼️</span>
              <span>Clique para selecionar imagens</span>
              <span className={styles.hint}>JPG, PNG — até 20 imagens, 20MB cada</span>
            </div>
          ) : (
            <div className={styles.previewGrid}>
              {previews.map((src, i) => (
                <div key={i} className={styles.previewItem}>
                  <img src={src} alt={`${i+1}`} />
                  <button type="button" className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}>✕</button>
                  <span className={styles.pageNum}>Pág. {i+1}</span>
                </div>
              ))}
              <div className={styles.addMore} onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>+ Mais</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple onChange={handleFiles} style={{ display:"none" }} />
        </div>

        {files.length > 0 && <p className={styles.count}>📎 {files.length} imagem(ns)</p>}

        <div className={styles.config}>
          <div className={styles.field}>
            <label>Nome do arquivo</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lista_Matematica" />
          </div>
          <div className={styles.field}>
            <label>Modo</label>
            <div className={styles.modeGrid}>
              {[
                { v:"single",   icon:"📄", label:"Um único PDF",    hint:"Todas as páginas em sequência" },
                { v:"multiple", icon:"📚", label:"PDFs separados",  hint:"Um PDF por imagem"             },
              ].map((m) => (
                <button key={m.v} type="button"
                  className={`${styles.modeBtn} ${mode === m.v ? styles.modeActive : ""}`}
                  onClick={() => setMode(m.v)}>
                  <span className={styles.modeIcon}>{m.icon}</span>
                  <span className={styles.modeLabel}>{m.label}</span>
                  <span className={styles.modeHint}>{m.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className={styles.convertBtn} onClick={handleConvert}
          disabled={converting || !files.length}>
          {converting ? "⏳ Convertendo..." : `🔄 Converter ${files.length || ""} imagem(ns)`}
        </button>

        {results.length > 0 && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <span>✅ {results.length} PDF(s) pronto(s)!</span>
              {results.length > 1 && (
                <button onClick={() => results.forEach((r) => {
                  const a = document.createElement("a"); a.href = r.url; a.download = r.name; a.click();
                })}>⬇️ Baixar todos</button>
              )}
            </div>
            {results.map((r, i) => (
              <div key={i} className={styles.resultRow}>
                <span>📄 {r.name}</span>
                <div className={styles.resultBtns}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">👁️ Ver</a>
                  <a href={r.url} download={r.name}>⬇️ Baixar</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
