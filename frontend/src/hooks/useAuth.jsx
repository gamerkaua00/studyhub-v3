// ============================================================
// StudyHub v2 — hooks/useAuth.js
// Gerencia autenticação no frontend
// ============================================================

import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica sessão salva ao carregar
  useEffect(() => {
    const token = localStorage.getItem("studyhub_token");
    const saved = localStorage.getItem("studyhub_user");
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, { username, password });
    const { token, role, username: uname } = res.data;
    localStorage.setItem("studyhub_token", token);
    localStorage.setItem("studyhub_user", JSON.stringify({ username: uname, role }));
    setUser({ username: uname, role });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("studyhub_token");
    localStorage.removeItem("studyhub_user");
    setUser(null);
  };

  const isAdmin = () => user?.username?.toLowerCase() === "mazur";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
