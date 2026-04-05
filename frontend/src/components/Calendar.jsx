// ============================================================
// StudyHub — components/Calendar.jsx
// Calendário mensal estilo Google Calendar
// ============================================================

import React, { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "./Calendar.module.css";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Agrupa uma lista de conteúdos por data ("YYYY-MM-DD")
 */
const groupByDate = (contents) => {
  const map = {};
  for (const c of contents) {
    if (!map[c.date]) map[c.date] = [];
    map[c.date].push(c);
  }
  return map;
};

export default function Calendar({ currentDate, contents = [], onDayClick }) {
  // Gera todos os dias visíveis no grid (incluindo dias de meses adjacentes)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(currentDate);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const contentsByDate = useMemo(() => groupByDate(contents), [contents]);

  return (
    <div className={styles.calendar}>
      {/* Cabeçalho com dias da semana */}
      <div className={styles.weekHeader}>
        {WEEKDAYS.map((d) => (
          <div key={d} className={styles.weekDay}>{d}</div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className={styles.grid}>
        {days.map((day) => {
          const key       = format(day, "yyyy-MM-dd");
          const inMonth   = isSameMonth(day, currentDate);
          const today     = isToday(day);
          const dayEvents = contentsByDate[key] || [];

          // Limita a exibição para não transbordar a célula
          const visible  = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={key}
              className={`${styles.cell} ${!inMonth ? styles.otherMonth : ""} ${today ? styles.today : ""}`}
              onClick={() => onDayClick && onDayClick(day, dayEvents)}
              title={`${dayEvents.length} item(s) em ${format(day, "dd/MM/yyyy")}`}
            >
              <span className={styles.dayNumber}>
                {format(day, "d")}
              </span>

              {/* Eventos do dia */}
              <div className={styles.events}>
                {visible.map((c) => (
                  <div
                    key={c._id}
                    className={styles.event}
                    style={{ background: c.subjectColor + "22", borderLeft: `3px solid ${c.subjectColor}` }}
                    title={`${c.time} — ${c.title}`}
                  >
                    <span className={styles.eventTime}>{c.time}</span>
                    <span className={styles.eventTitle}>{c.title}</span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className={styles.overflow}>+{overflow} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
