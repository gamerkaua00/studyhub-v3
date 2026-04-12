// StudyHub v3.1.2 — PdfPage.jsx — Conversão de imagens para PDF
import React, { useState, useRef } from "react";
import api from "../utils/api";
import styles from "./PdfPage.module.css";

export default function PdfPage() {
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mode, setMode]       = useState("single"); // single | multiple
  const [title, setTitle]     = useState("");
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError]     = useState(null);
  const fileRef               = useRef();

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
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
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      fd.append("mode", mode);
      fd.append("title", title || "documento");

      if (mode === "single") {
        // Recebe um PDF como blob
        const res = await api.post("/api/pdf/convert", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
          timeout: 120000,
        });
        const url  = URL.createObjectURL(new Blob([res], { type: "application/pdf" }));
        const name = `${title || "documento"}.pdf`;
        setResults([{ url, name }]);
      } else {
        // Recebe array de PDFs em base64
        const res = await api.post("/api/pdf/convert", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        });
        const pdfs = (res.pdfs || []).map((p) => {
          const bytes = atob(p.data);
          const arr   = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const url   = URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
          return { url, name: p.name };
        });
        setResults(pdfs);
      }
    } catch (err) { setError("Erro na conversão: " + err.message); }
    finally { setConverting(false); }
  };

  const downloadAll = () => {
    results.forEach((r) => {
      const a = document.createElement("a");
      a.href = r.url; a.download = r.name; a.click();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>📄 Converter Imagens para PDF</h2>
        <p className={styles.subtitle}>Ideal para listas, exercícios e materiais com várias páginas.</p>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        {/* Upload */}
        <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
          {previews.length === 0 ? (
            <div className={styles.uploadPlaceholder}>
              <span className={styles.uploadIcon}>🖼️</span>
              <span>Clique para selecionar imagens</span>
              <span className={styles.hint}>JPG, PNG, WEBP — até 20 imagens</span>
            </div>
          ) : (
            <div className={styles.previewGrid}>
              {previews.map((src, i) => (
                <div key={i} className={styles.previewItem}>
                  <img src={src} alt={`${i+1}`} className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeFile(i); }}>✕</button>
                  <span className={styles.pageNum}>Pág. {i+1}</span>
                </div>
              ))}
              <div className={styles.addMore} onClick={() => fileRef.current.click()}>+ Mais</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className={styles.fileInput} />
        </div>

        {files.length > 0 && <p className={styles.fileCount}>📎 {files.length} imagem(ns) selecionada(s)</p>}

        {/* Configurações */}
        <div className={styles.config}>
          <div className={styles.field}>
            <label>Nome do arquivo</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lista_Matematica" />
          </div>
          <div className={styles.field}>
            <label>Modo de conversão</label>
            <div className={styles.modeGrid}>
              <button type="button" className={`${styles.modeBtn} ${mode === "single" ? styles.modeActive : ""}`} onClick={() => setMode("single")}>
                <span className={styles.modeBtnIcon}>📄</span>
                <span>Um único PDF</span>
                <span className={styles.modeBtnHint}>Todas as imagens em sequência</span>
              </button>
              <button type="button" className={`${styles.modeBtn} ${mode === "multiple" ? styles.modeActive : ""}`} onClick={() => setMode("multiple")}>
                <span className={styles.modeBtnIcon}>📚</span>
                <span>PDFs separados</span>
                <span className={styles.modeBtnHint}>Um PDF por imagem</span>
              </button>
            </div>
          </div>
        </div>

        <button className={styles.convertBtn} onClick={handleConvert} disabled={converting || !files.length}>
          {converting ? "⏳ Convertendo..." : `🔄 Converter ${files.length} imagem(ns)`}
        </button>

        {/* Resultados */}
        {results.length > 0 && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <span className={styles.resultsTitle}>✅ {results.length} PDF(s) pronto(s)!</span>
              {results.length > 1 && (
                <button className={styles.downloadAllBtn} onClick={downloadAll}>⬇️ Baixar todos</button>
              )}
            </div>
            {results.map((r, i) => (
              <div key={i} className={styles.resultItem}>
                <span className={styles.resultName}>📄 {r.name}</span>
                <div className={styles.resultActions}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className={styles.previewPdfBtn}>👁️ Visualizar</a>
                  <a href={r.url} download={r.name} className={styles.downloadBtn}>⬇️ Baixar</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
