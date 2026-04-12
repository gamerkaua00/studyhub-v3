// StudyHub v3.1.1 — StatsPage.jsx
import React, { useState, useEffect } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "../utils/api";
import styles from "./StatsPage.module.css";

const TYPE_COLOR = { Aula:"#5865F2",Revisão:"#57F287",Prova:"#ED4245",Apresentação:"#EB459E",Atividade:"#FEE75C",Avaliação:"#E67E22",Lista:"#9B59B6" };
const TYPE_EMOJI = { Aula:"📖",Revisão:"🔄",Prova:"📝",Apresentação:"🎤",Atividade:"📋",Avaliação:"📊",Lista:"📃" };
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function StatsPage() {
  const [date, setDate]   = useState(new Date());
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, [date]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/stats/overview?month=${date.getMonth()+1}&year=${date.getFullYear()}`);
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const maxByType    = data ? Math.max(...Object.values(data.byType), 1) : 1;
  const maxBySubject = data ? Math.max(...Object.values(data.bySubject), 1) : 1;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={() => setDate((d) => subMonths(d, 1))}>‹</button>
        <h2 className={styles.monthTitle}>{MONTHS[date.getMonth()]} {date.getFullYear()}</h2>
        <button className={styles.navBtn} onClick={() => setDate((d) => addMonths(d, 1))}>›</button>
      </div>

      {loading ? (
        <div className={styles.loading}><span className={styles.spinner} /> Carregando...</div>
      ) : !data ? (
        <div className={styles.empty}>Sem dados para este mês.</div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className={styles.cards}>
            {[
              { label: "Total de Conteúdos", value: data.total, icon: "📚", color: "#5865F2" },
              { label: "Notificações Enviadas", value: data.sentNotifications, icon: "📢", color: "#57F287" },
              { label: "Provas/Avaliações", value: (data.byType["Prova"] || 0) + (data.byType["Avaliação"] || 0), icon: "📝", color: "#ED4245" },
              { label: "Próximas Provas", value: data.upcomingExams?.length || 0, icon: "⏰", color: "#FEE75C" },
            ].map((c) => (
              <div key={c.label} className={styles.summaryCard} style={{ borderTopColor: c.color }}>
                <span className={styles.cardIcon}>{c.icon}</span>
                <span className={styles.cardValue}>{c.value}</span>
                <span className={styles.cardLabel}>{c.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.chartsRow}>
            {/* Por tipo */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>📊 Por Tipo</h3>
              {Object.keys(TYPE_EMOJI).map((type) => {
                const count = data.byType[type] || 0;
                const pct   = Math.round((count / maxByType) * 100);
                return (
                  <div key={type} className={styles.barRow}>
                    <span className={styles.barLabel}>{TYPE_EMOJI[type]} {type}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%`, background: TYPE_COLOR[type] || "#5865F2" }} />
                    </div>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Por matéria */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>📌 Por Matéria</h3>
              {Object.entries(data.bySubject).sort((a,b) => b[1]-a[1]).map(([subj, count]) => {
                const pct = Math.round((count / maxBySubject) * 100);
                return (
                  <div key={subj} className={styles.barRow}>
                    <span className={styles.barLabel}>{subj}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%`, background: "#5865F2" }} />
                    </div>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                );
              })}
              {Object.keys(data.bySubject).length === 0 && <p className={styles.noData}>Sem dados</p>}
            </div>
          </div>

          {/* Próximas provas */}
          {data.upcomingExams?.length > 0 && (
            <div className={styles.examCard}>
              <h3 className={styles.chartTitle}>📝 Próximas Provas</h3>
              <div className={styles.examList}>
                {data.upcomingExams.map((exam) => {
                  const [y,m,d] = exam.date.split("-");
                  const urgent  = exam.daysUntil <= 3;
                  return (
                    <div key={exam._id} className={`${styles.examRow} ${urgent ? styles.examUrgent : ""}`}>
                      <div>
                        <p className={styles.examTitle}>{exam.title}</p>
                        <p className={styles.examMeta}>{exam.subject} • {d}/{m}/{y} às {exam.time}</p>
                      </div>
                      <span className={`${styles.examDays} ${urgent ? styles.examDaysUrgent : ""}`}>
                        {exam.daysUntil === 0 ? "🔴 HOJE" : exam.daysUntil === 1 ? "🟠 Amanhã" : `🟢 ${exam.daysUntil}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
