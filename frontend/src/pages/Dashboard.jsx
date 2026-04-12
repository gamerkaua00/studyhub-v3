// StudyHub v3 — Dashboard.jsx — REVISADO COMPLETO
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, subMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contentApi, holidayApi, eventApi } from "../utils/api";
import styles from "./Dashboard.module.css";

const TYPE_EMOJI = { Aula:"📖",Revisão:"🔄",Prova:"📝",Apresentação:"🎤",Atividade:"📋",Avaliação:"📊",Lista:"📃" };
const TYPE_COLOR = { Aula:"#5865F2",Revisão:"#57F287",Prova:"#ED4245",Apresentação:"#EB459E",Atividade:"#FEE75C",Avaliação:"#E67E22",Lista:"#9B59B6" };

const getBRT = () => {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView]           = useState("month"); // month | week
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contents, setContents]   = useState([]);
  const [holidays, setHolidays]   = useState([]);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filterType, setFilterType]     = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [selectedDay, setSelectedDay]   = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent]   = useState({ title:"", date:"", time:"", color:"#FEE75C", icon:"📌", type:"evento", description:"", notifyDiscord:false });
  const [duplicating, setDuplicating]   = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    const month = currentDate.getMonth() + 1;
    const year  = currentDate.getFullYear();
    try {
      const [c, h, e] = await Promise.all([
        contentApi.getAll({ month, year }),
        holidayApi.getAll({ month, year }),
        eventApi.getAll({ month, year }),
      ]);
      setContents(c.data || []);
      setHolidays(h.data || []);
      setEvents(e.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [currentDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    try {
      await contentApi.delete(id);
      setContents((p) => p.filter((c) => c._id !== id));
    } catch (err) { alert("Erro: " + err.message); }
  };

  const handleDuplicate = async (content) => {
    setDuplicating(content._id);
    try {
      const { _id, createdAt, updatedAt, notifications, ...rest } = content;
      const tomorrow = format(addDays(new Date(content.date + "T12:00:00"), 7), "yyyy-MM-dd");
      await contentApi.create({ ...rest, date: tomorrow, notifications: undefined });
      await fetchAll();
    } catch (err) { alert("Erro ao duplicar: " + err.message); }
    finally { setDuplicating(null); }
  };

  const handleDayClick = (dateStr) => {
    setSelectedDay(dateStr);
    sessionStorage.setItem("prefilledDate", dateStr);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await eventApi.create(newEvent);
      setShowEventForm(false);
      setNewEvent({ title:"", date:"", time:"", color:"#FEE75C", icon:"📌", type:"evento", description:"", notifyDiscord:false });
      await fetchAll();
    } catch (err) { alert("Erro: " + err.message); }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Excluir este evento?")) return;
    await eventApi.delete(id);
    await fetchAll();
  };

  // Stats
  const brtToday = getBRT().toISOString().split("T")[0];
  const todayContents = contents.filter((c) => c.date === brtToday);
  const nextExam = contents.filter((c) => (c.type === "Prova" || c.type === "Avaliação") && c.date >= brtToday).sort((a,b) => a.date.localeCompare(b.date))[0];
  const daysToExam = nextExam ? Math.round((new Date(nextExam.date + "T00:00:00Z") - new Date(brtToday + "T00:00:00Z")) / 86400000) : null;

  const filteredContents = contents
    .filter((c) => filterType    ? c.type    === filterType    : true)
    .filter((c) => filterSubject ? c.subject === filterSubject : true)
    .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

  const subjects = [...new Set(contents.map((c) => c.subject))].sort();

  // Calendar helpers
  const month = currentDate.getMonth();
  const year  = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (d) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const getHolidayForDate = (dateStr) => holidays.find((h) => h.date === dateStr);
  const getEventsForDate  = (dateStr) => events.filter((e) => e.date === dateStr);
  const getContentsForDate = (dateStr) => contents.filter((c) => c.date === dateStr);

  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <div className={styles.page}>
      {/* Banner próxima prova */}
      {nextExam && (
        <div className={`${styles.examBanner} ${daysToExam === 0 ? styles.examToday : daysToExam <= 3 ? styles.examSoon : ""}`}>
          <span>📝</span>
          <span>Próxima prova: <strong>{nextExam.subject} — {nextExam.title}</strong></span>
          <span className={styles.examCountdown}>
            {daysToExam === 0 ? "🔴 HOJE!" : daysToExam === 1 ? "🟠 Amanhã!" : `🟢 Em ${daysToExam} dias`}
          </span>
        </div>
      )}

      {/* Widget Hoje */}
      {todayContents.length > 0 && (
        <div className={styles.todayWidget}>
          <span className={styles.todayLabel}>📅 Hoje — {format(getBRT(), "dd/MM")}</span>
          <div className={styles.todayItems}>
            {todayContents.map((c) => (
              <span key={c._id} className={styles.todayChip} style={{ borderColor: TYPE_COLOR[c.type] || "#5865F2" }}>
                {TYPE_EMOJI[c.type]} {c.time} {c.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        {[
          { label:"Total", value: contents.length, color:"var(--color-border)" },
          { label:"📖 Aulas", value: contents.filter((c) => c.type==="Aula").length, color:"#5865F2" },
          { label:"📝 Provas", value: contents.filter((c) => c.type==="Prova"||c.type==="Avaliação").length, color:"#ED4245" },
          { label:"📋 Trabalhos", value: contents.filter((c) => ["Apresentação","Atividade","Lista"].includes(c.type)).length, color:"#FEE75C" },
        ].map((s) => (
          <div key={s.label} className={styles.stat} style={{ borderTopColor: s.color }}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Calendário */}
        <div className={styles.calendarCol}>
          <div className={styles.calHeader}>
            <button className={styles.navBtn} onClick={() => setCurrentDate((d) => subMonths(d, 1))}>‹</button>
            <div className={styles.calTitle}>
              <h2>{MONTHS[month]} <span>{year}</span></h2>
            </div>
            <button className={styles.navBtn} onClick={() => setCurrentDate((d) => addMonths(d, 1))}>›</button>
            <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Hoje</button>
            <button className={styles.addEventBtn} onClick={() => { setNewEvent((p) => ({ ...p, date: brtToday })); setShowEventForm(true); }}>+ Evento</button>
          </div>

          {loading ? (
            <div className={styles.calLoading}><span className={styles.spinner} /> Carregando...</div>
          ) : error ? (
            <div className={styles.calError}>⚠️ {error} <button onClick={fetchAll}>Tentar novamente</button></div>
          ) : (
            <div className={styles.calendar}>
              {WEEKDAYS.map((d) => <div key={d} className={styles.weekday}>{d}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className={styles.cellEmpty} />;
                const dateStr  = getDateStr(day);
                const isToday  = dateStr === brtToday;
                const holiday  = getHolidayForDate(dateStr);
                const dayEvts  = getEventsForDate(dateStr);
                const dayConts = getContentsForDate(dateStr);
                const isSelected = selectedDay === dateStr;

                return (
                  <div key={day}
                    className={`${styles.cell} ${isToday ? styles.cellToday : ""} ${holiday ? styles.cellHoliday : ""} ${isSelected ? styles.cellSelected : ""}`}
                    onClick={() => handleDayClick(dateStr)}
                  >
                    <span className={styles.dayNum}>{day}</span>
                    {holiday && <span className={styles.holidayTag} title={holiday.name}>🏖️</span>}
                    <div className={styles.cellEvents}>
                      {dayConts.slice(0, 3).map((c) => (
                        <div key={c._id} className={styles.cellEvent} style={{ background: TYPE_COLOR[c.type] || "#5865F2" }}>
                          {c.time} {c.title}
                        </div>
                      ))}
                      {dayEvts.map((e) => (
                        <div key={e._id} className={styles.cellEvent} style={{ background: e.color || "#FEE75C", color: "#000" }}>
                          {e.icon} {e.title}
                        </div>
                      ))}
                      {dayConts.length > 3 && <div className={styles.moreTag}>+{dayConts.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legenda de feriados do mês */}
          {holidays.length > 0 && (
            <div className={styles.holidayList}>
              <span className={styles.holidayListTitle}>🏖️ Feriados do mês:</span>
              {holidays.map((h) => (
                <span key={h._id} className={styles.holidayItem}>
                  {h.date.split("-").reverse().slice(0,2).join("/")} — {h.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Lista de conteúdos */}
        <div className={styles.listCol}>
          <div className={styles.listHeader}>
            <h3>Conteúdos do Mês <span className={styles.listCount}>{filteredContents.length}</span></h3>
            <button className={styles.addBtn} onClick={() => navigate("/novo")}>+ Novo</button>
          </div>
          <div className={styles.filters}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.keys(TYPE_EMOJI).map((t) => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
            </select>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">Todas as matérias</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.list}>
            {filteredContents.length === 0 ? (
              <div className={styles.empty}>
                <span>📭</span>
                <p>Nenhum conteúdo para este mês.</p>
                <button onClick={() => navigate("/novo")}>Adicionar conteúdo</button>
              </div>
            ) : filteredContents.map((c) => {
              const [y,m,d] = c.date.split("-");
              return (
                <div key={c._id} className={styles.contentCard} style={{ borderLeftColor: TYPE_COLOR[c.type] || "#5865F2" }}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardSubject}>{c.subject}</span>
                      <span className={styles.cardType} style={{ color: TYPE_COLOR[c.type] }}>{TYPE_EMOJI[c.type]} {c.type}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.actionBtn} onClick={() => navigate(`/editar/${c._id}`)} title="Editar">✏️</button>
                      <button className={styles.actionBtn} onClick={() => handleDuplicate(c)} title="Duplicar (próxima semana)" disabled={duplicating === c._id}>
                        {duplicating === c._id ? "⏳" : "📋"}
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleDelete(c._id)} title="Excluir">🗑️</button>
                    </div>
                  </div>
                  <p className={styles.cardTitle}>{c.title}</p>
                  <div className={styles.cardFooter}>
                    <span>📅 {d}/{m}/{y} às {c.time}</span>
                    <span className={styles.cardChannel}>#{c.discordChannel}</span>
                  </div>
                  {c.notifications?.sentMain && <span className={styles.sentBadge}>✅ Notificação enviada</span>}
                </div>
              );
            })}
          </div>

          {/* Eventos do mês */}
          {events.length > 0 && (
            <div className={styles.eventsSection}>
              <h4 className={styles.eventsSectionTitle}>📌 Eventos do Mês</h4>
              {events.map((e) => {
                const [y,m,d] = e.date.split("-");
                return (
                  <div key={e._id} className={styles.eventCard} style={{ borderLeftColor: e.color }}>
                    <span>{e.icon} <strong>{e.title}</strong> — {d}/{m}</span>
                    <button className={styles.actionBtn} onClick={() => handleDeleteEvent(e._id)}>🗑️</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar Evento */}
      {showEventForm && (
        <div className={styles.modalOverlay} onClick={() => setShowEventForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>📌 Novo Evento</h3>
            <form onSubmit={handleAddEvent} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Título *</label>
                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent((p) => ({...p, title: e.target.value}))} required placeholder="Ex: Reunião de grupo" />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Data *</label>
                  <input type="date" value={newEvent.date} onChange={(e) => setNewEvent((p) => ({...p, date: e.target.value}))} required />
                </div>
                <div className={styles.field}>
                  <label>Horário</label>
                  <input type="time" value={newEvent.time} onChange={(e) => setNewEvent((p) => ({...p, time: e.target.value}))} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Tipo</label>
                  <select value={newEvent.type} onChange={(e) => setNewEvent((p) => ({...p, type: e.target.value}))}>
                    <option value="evento">📌 Evento</option>
                    <option value="reuniao">🤝 Reunião</option>
                    <option value="prazo">⏰ Prazo</option>
                    <option value="viagem">✈️ Viagem</option>
                    <option value="outro">📁 Outro</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Cor</label>
                  <input type="color" value={newEvent.color} onChange={(e) => setNewEvent((p) => ({...p, color: e.target.value}))} style={{ height: "38px", cursor: "pointer" }} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Descrição</label>
                <input type="text" value={newEvent.description} onChange={(e) => setNewEvent((p) => ({...p, description: e.target.value}))} placeholder="Descrição opcional" />
              </div>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={newEvent.notifyDiscord} onChange={(e) => setNewEvent((p) => ({...p, notifyDiscord: e.target.checked}))} />
                Notificar no Discord (#agenda)
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowEventForm(false)}>Cancelar</button>
                <button type="submit" className={styles.submitBtn}>✅ Criar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
