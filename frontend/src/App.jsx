// StudyHub v3 — App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ContentForm from "./pages/ContentForm";
import SubjectsPage from "./pages/SubjectsPage";
import LoginPage from "./pages/LoginPage";
import PublicAgenda from "./pages/PublicAgenda";
import PendingUsers from "./pages/PendingUsers";
import MessagesPage from "./pages/MessagesPage";
import AttendancePage from "./pages/AttendancePage";
import GalleryPage from "./pages/GalleryPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"var(--text-secondary)" }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/agenda-publica" element={<PublicAgenda />} />
      <Route path="/"               element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/novo"           element={<ProtectedRoute><Layout><ContentForm /></Layout></ProtectedRoute>} />
      <Route path="/editar/:id"     element={<ProtectedRoute><Layout><ContentForm /></Layout></ProtectedRoute>} />
      <Route path="/materias"       element={<ProtectedRoute><Layout><SubjectsPage /></Layout></ProtectedRoute>} />
      <Route path="/mensagens"      element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
      <Route path="/atendimento"    element={<ProtectedRoute><Layout><AttendancePage /></Layout></ProtectedRoute>} />
      <Route path="/galeria"        element={<ProtectedRoute><Layout><GalleryPage /></Layout></ProtectedRoute>} />
      <Route path="/cadastros"      element={<AdminRoute><Layout><PendingUsers /></Layout></AdminRoute>} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
