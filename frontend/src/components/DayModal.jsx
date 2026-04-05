// ============================================================
// StudyHub — components/DayModal.jsx
// Modal exibido ao clicar em um dia do calendário
// ============================================================

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "./DayModal.module.css";

const TYPE_ICONS = { Aula: "📖", Revisão: "🔄", Prova: "📝" };

export default function DayModal({ day, events, onClose, onDelete }) {
  const navigate = useNavigate();

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDelete = (id, title) => {
    if (confirm(`Excluir "${title}"?`)) {
      onDelete(id);
      if (events.length === 1) onClose(); // fecha se era o último
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.dayLabel}>
              {format(day, "EEEE", { locale: ptBR })}
            </p>
            <h2 className={styles.dayDate}>
              {format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className={styles.body}>
          {events.length === 0 ? (
            <div className={styles.empty}>
              <span>📭</span>
              <p>Nenhum conteúdo neste dia.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className={styles.item}
                  style={{ borderLeft: `4px solid ${ev.subjectColor}` }}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemType}>
                      {TYPE_ICONS[ev.type]} {ev.type}
                    </span>
                    <span
                      className={styles.itemSubject}
                      style={{ color: ev.subjectColor }}
                    >
                      {ev.subject}
                    </span>
                  </div>

                  <h3 className={styles.itemTitle}>{ev.title}</h3>

                  <div className={styles.itemMeta}>
                    <span>🕐 {ev.time}</span>
                    <span>#{ev.discordChannel}</span>
                  </div>

                  {ev.description && (
                    <p className={styles.itemDesc}>{ev.description}</p>
                  )}

                  {ev.resourceLink && (
                    <a
                      href={ev.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.itemLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 Acessar material
                    </a>
                  )}

                  <div className={styles.itemActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => { onClose(); navigate(`/editar/${ev._id}`); }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(ev._id, ev.title)}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.addBtn}
            onClick={() => { onClose(); navigate("/novo"); }}
          >
            + Adicionar neste dia
          </button>
        </div>
      </div>
    </div>
  );
}
