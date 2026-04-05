// ============================================================
// StudyHub — components/ContentCard.jsx
// Card de exibição de um conteúdo de estudo
// ============================================================

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ContentCard.module.css";

const TYPE_ICONS = { Aula: "📖", Revisão: "🔄", Prova: "📝" };

export default function ContentCard({ content, onDelete }) {
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Excluir "${content.title}"?`)) {
      onDelete(content._id);
    }
  };

  return (
    <div
      className={styles.card}
      style={{ borderLeft: `4px solid ${content.subjectColor}` }}
      onClick={() => navigate(`/editar/${content._id}`)}
    >
      <div className={styles.header}>
        <span className={styles.typeIcon}>{TYPE_ICONS[content.type] || "📚"}</span>
        <div className={styles.meta}>
          <span
            className={styles.subject}
            style={{ color: content.subjectColor }}
          >
            {content.subject}
          </span>
          <span className={`${styles.typeBadge} ${styles[content.type?.toLowerCase()]}`}>
            {content.type}
          </span>
        </div>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/editar/${content._id}`)}
            title="Editar"
          >
            ✏️
          </button>
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            title="Excluir"
          >
            🗑️
          </button>
        </div>
      </div>

      <h3 className={styles.title}>{content.title}</h3>

      <div className={styles.footer}>
        <span className={styles.dateTime}>
          📅 {content.date?.split("-").reverse().join("/")} às {content.time}
        </span>
        <span className={styles.channel}>
          # {content.discordChannel}
        </span>
      </div>

      {content.notifications?.sentMain && (
        <div className={styles.sentBadge}>✅ Notificação enviada</div>
      )}
    </div>
  );
}
