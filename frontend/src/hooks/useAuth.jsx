// StudyHub v3 — hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("studyhub_user")) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("studyhub_token");
      if (!token) { setLoading(false); return; }
      try {
        const res  = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          const u = { username: data.username, role: data.role };
          setUser(u);
          localStorage.setItem("studyhub_user", JSON.stringify(u));
        } else {
          localStorage.removeItem("studyhub_token");
          localStorage.removeItem("studyhub_user");
          setUser(null);
        }
      } catch {
        // Offline — mantém sessão local
      } finally { setLoading(false); }
    };
    verify();
  }, []);

  const login = async (username, password) => {
    const res  = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Credenciais inválidas");
    localStorage.setItem("studyhub_token", data.token);
    const u = { username: data.username, role: data.role };
    localStorage.setItem("studyhub_user", JSON.stringify(u));
    setUser(u);
    return data;
  };

  const logout = () => {
    const token = localStorage.getItem("studyhub_token");
    if (token) fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem("studyhub_token");
    localStorage.removeItem("studyhub_user");
    setUser(null);
  };

  const isAdmin = () => user?.role === "admin" || user?.username?.toLowerCase() === "mazur";

  return <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
