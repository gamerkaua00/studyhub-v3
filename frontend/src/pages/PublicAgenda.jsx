// ============================================================
// StudyHub v2 — pages/PublicAgenda.jsx
// Página pública de visualização da agenda (sem login)
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import Calendar from "../components/Calendar";
import styles from "./PublicAgenda.module.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function PublicAgenda() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contents, setContents]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year  = currentDate.getFullYear();
        const res   = await fetch(`${BASE_URL}/api/public/agenda?month=${month}&year=${year}`);
        const data  = await res.json();
        setContents(data.data || []);
      } catch { setContents([]); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [currentDate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span>📚</span>
          <span>StudyHub</span>
          <span className={styles.badge}>Agenda Pública</span>
        </div>
        <button className={styles.loginBtn} onClick={() => navigate("/login")}>
          Entrar →
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.nav}>
          <button onClick={() => setCurrentDate((d) => subMonths(d, 1))}>‹</button>
          <h2 className={styles.monthTitle}>
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <button onClick={() => setCurrentDate((d) => addMonths(d, 1))}>›</button>
          <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Hoje</button>
        </div>

        {loading ? (
          <div className={styles.loading}>⏳ Carregando agenda...</div>
        ) : (
          <Calendar currentDate={currentDate} contents={contents} />
        )}

        <p className={styles.info}>
          🔒 Para cadastrar ou editar conteúdos, <button onClick={() => navigate("/login")} className={styles.inlineLink}>faça login</button>.
        </p>
      </div>
    </div>
  );
}
