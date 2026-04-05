// StudyHub v3 — Layout.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import styles from "./Layout.module.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin()) return;
    const check = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/api/auth/pending`, { headers: { Authorization: `Bearer ${localStorage.getItem("studyhub_token")}` } });
        const data = await res.json();
        setPendingCount(data.data?.length || 0);
      } catch {}
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const NAV_ITEMS = [
    { to: "/",            icon: "🗓️",  label: "Dashboard"   },
    { to: "/novo",        icon: "➕",  label: "Novo Conteúdo" },
    { to: "/materias",    icon: "🎨",  label: "Matérias"    },
    { to: "/mensagens",   icon: "📢",  label: "Mensagens"   },
    { to: "/atendimento", icon: "🏫",  label: "Atendimento" },
    { to: "/galeria",     icon: "📷",  label: "Galeria"     },
    ...(isAdmin() ? [{ to: "/cadastros", icon: "🔔", label: "Cadastros", badge: pendingCount }] : []),
  ];

  return (
    <div className={styles.root}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.logo}><span>📚</span><span className={styles.logoText}>StudyHub</span></div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge > 0 && <span className={styles.navBadge}>{item.badge}</span>}
            </NavLink>
          ))}
          <a href={`${import.meta.env.BASE_URL}agenda-publica`} target="_blank" rel="noopener noreferrer" className={styles.navItem}>
            <span className={styles.navIcon}>👁️</span>
            <span className={styles.navLabel}>Agenda Pública</span>
          </a>
        </nav>
        <div className={styles.userBox}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>{isAdmin() ? "🛡️" : "👤"}</span>
            <div>
              <span className={styles.userName}>{user?.username}</span>
              <span className={styles.userRole}>{isAdmin() ? "Administrador" : user?.role}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sair">↩</button>
        </div>
        <div className={styles.sidebarFooter}><span className={styles.footerText}>🤖 Bot Discord ativo</span></div>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen((o) => !o)}>☰</button>
          <h1 className={styles.pageTitle}>StudyHub</h1>
          <div className={styles.headerRight}>
            <span className={styles.statusBadge}><span className={styles.statusDot} />Online</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
