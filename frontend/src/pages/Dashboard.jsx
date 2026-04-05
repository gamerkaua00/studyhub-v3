// StudyHub v3 — Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import Calendar from "../components/Calendar";
import ContentCard from "../components/ContentCard";
import DayModal from "../components/DayModal";
import { contentApi } from "../utils/api";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contents, setContents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filterType, setFilterType]   = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [modalDay, setModalDay]       = useState(null);
  const [modalEvents, setModalEvents] = useState([]);

  const fetchContents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const month = currentDate.getMonth() + 1;
      const year  = currentDate.getFullYear();
      const res   = await contentApi.getAll({ month, year });
      setContents(res.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [currentDate]);

  useEffect(() => { fetchContents(); }, [fetchContents]);

  const handleDelete = async (id) => {
    try { await contentApi.delete(id); setContents((p) => p.filter((c) => c._id !== id)); }
    catch (err) { alert("Erro ao excluir: " + err.message); }
  };

  // Ao clicar num dia → abre modal E pré-preenche data no formulário
  const handleDayClick = (day, events) => {
    setModalDay(day);
    setModalEvents(events);
    // Salva no sessionStorage para o ContentForm pegar
    sessionStorage.setItem("prefilledDate", format(day, "yyyy-MM-dd"));
  };

  const filteredContents = contents
    .filter((c) => filterType    ? c.type    === filterType    : true)
    .filter((c) => filterSubject ? c.subject === filterSubject : true)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const subjects = [...new Set(contents.map((c) => c.subject))].sort();
  const stats    = { total: contents.length, aula: contents.filter((c) => c.type === "Aula").length, revisao: contents.filter((c) => c.type === "Revisão").length, prova: contents.filter((c) => c.type === "Prova").length };

  // Próxima prova
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const today = brt.toISOString().split("T")[0];
  const nextExam = contents.filter((c) => c.type === "Prova" && c.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const daysToExam = nextExam ? Math.round((new Date(nextExam.date + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000) : null;

  return (
    <div className={styles.page}>
      {/* Próxima prova banner */}
      {nextExam && (
        <div className={`${styles.examBanner} ${daysToExam === 0 ? styles.examToday : daysToExam <= 3 ? styles.examSoon : ""}`}>
          <span>📝</span>
          <span>Próxima prova: <strong>{nextExam.subject} — {nextExam.title}</strong></span>
          <span className={styles.examCountdown}>
            {daysToExam === 0 ? "🔴 HOJE!" : daysToExam === 1 ? "🟠 Amanhã!" : `🟢 Em ${daysToExam} dias`}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statValue}>{stats.total}</span><span className={styles.statLabel}>Total</span></div>
        <div className={`${styles.stat} ${styles.statAula}`}><span className={styles.statValue}>{stats.aula}</span><span className={styles.statLabel}>📖 Aulas</span></div>
        <div className={`${styles.stat} ${styles.statRevisao}`}><span className={styles.statValue}>{stats.revisao}</span><span className={styles.statLabel}>🔄 Revisões</span></div>
        <div className={`${styles.stat} ${styles.statProva}`}><span className={styles.statValue}>{stats.prova}</span><span className={styles.statLabel}>📝 Provas</span></div>
      </div>

      <div className={styles.layout}>
        <div className={styles.calendarCol}>
          <div className={styles.calNav}>
            <button className={styles.navBtn} onClick={() => setCurrentDate((d) => subMonths(d, 1))}>‹</button>
            <div className={styles.monthTitle}>
              <h2 className={styles.monthName}>{format(currentDate, "MMMM", { locale: ptBR })}</h2>
              <span className={styles.year}>{format(currentDate, "yyyy")}</span>
            </div>
            <button className={styles.navBtn} onClick={() => setCurrentDate((d) => addMonths(d, 1))}>›</button>
            <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Hoje</button>
          </div>
          {loading ? (
            <div className={styles.loading}><span className={styles.spinner} />Carregando...</div>
          ) : error ? (
            <div className={styles.error}>⚠️ {error}<button onClick={fetchContents} className={styles.retryBtn}>Tentar novamente</button></div>
          ) : (
            <Calendar currentDate={currentDate} contents={contents} onDayClick={handleDayClick} />
          )}
        </div>

        <div className={styles.listCol}>
          <div className={styles.listHeader}>
            <h3 className={styles.listTitle}>Conteúdos do Mês<span className={styles.listCount}>{filteredContents.length}</span></h3>
            <button className={styles.addBtn} onClick={() => navigate("/novo")}>+ Novo</button>
          </div>
          <div className={styles.filters}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterSelect}>
              <option value="">Todos os tipos</option>
              <option value="Aula">📖 Aula</option>
              <option value="Revisão">🔄 Revisão</option>
              <option value="Prova">📝 Prova</option>
            </select>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className={styles.filterSelect}>
              <option value="">Todas as matérias</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.list}>
            {filteredContents.length === 0 ? (
              <div className={styles.empty}><span className={styles.emptyIcon}>📭</span><p>Nenhum conteúdo para este mês.</p><button className={styles.emptyAdd} onClick={() => navigate("/novo")}>Adicionar conteúdo</button></div>
            ) : (
              filteredContents.map((content) => <ContentCard key={content._id} content={content} onDelete={handleDelete} />)
            )}
          </div>
        </div>
      </div>

      {modalDay && <DayModal day={modalDay} events={modalEvents} onClose={() => setModalDay(null)} onDelete={handleDelete} />}
    </div>
  );
}
