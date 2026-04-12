// StudyHub v3 — utils/api.js — REVISADO COMPLETO
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("studyhub_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("studyhub_token");
      localStorage.removeItem("studyhub_user");
      window.location.href = `${import.meta.env.BASE_URL || "/"}login`;
    }
    return Promise.reject(new Error(err.response?.data?.message || err.message || "Erro de conexão"));
  }
);

export const contentApi = {
  getAll:  (p) => api.get("/api/contents", { params: p }),
  getById: (id) => api.get(`/api/contents/${id}`),
  create:  (d)  => api.post("/api/contents", d),
  update:  (id, d) => api.put(`/api/contents/${id}`, d),
  delete:  (id) => api.delete(`/api/contents/${id}`),
};

export const subjectApi = {
  getAll:  ()      => api.get("/api/subjects"),
  create:  (d)     => api.post("/api/subjects", d),
  update:  (id, d) => api.put(`/api/subjects/${id}`, d),
  delete:  (id)    => api.delete(`/api/subjects/${id}`),
};

export const messageApi = {
  getAll:  ()   => api.get("/api/messages"),
  create:  (d)  => api.post("/api/messages", d),
  delete:  (id) => api.delete(`/api/messages/${id}`),
};

export const attendanceApi = {
  getAll:  ()      => api.get("/api/attendance"),
  create:  (d)     => api.post("/api/attendance", d),
  update:  (id, d) => api.put(`/api/attendance/${id}`, d),
  delete:  (id)    => api.delete(`/api/attendance/${id}`),
};

export const galleryApi = {
  getAll:  (p)  => api.get("/api/gallery", { params: p }),
  upload:  (fd) => api.post("/api/gallery", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }),
  delete:  (id) => api.delete(`/api/gallery/${id}`),
};

export const holidayApi = {
  getAll:  (p)     => api.get("/api/holidays", { params: p }),
  getAllYear: ()    => api.get("/api/holidays/all"),
  create:  (d)     => api.post("/api/holidays", d),
  update:  (id, d) => api.put(`/api/holidays/${id}`, d),
  delete:  (id)    => api.delete(`/api/holidays/${id}`),
};

export const eventApi = {
  getAll:  (p)     => api.get("/api/events", { params: p }),
  create:  (d)     => api.post("/api/events", d),
  update:  (id, d) => api.put(`/api/events/${id}`, d),
  delete:  (id)    => api.delete(`/api/events/${id}`),
};

export const publicApi = {
  getToday:  ()  => api.get("/api/public/today"),
  getAgenda: (p) => api.get("/api/public/agenda", { params: p }),
  getExams:  ()  => api.get("/api/public/exams"),
};

export const pdfApi = {
  convert: (fd) => api.post("/api/pdf/convert", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000, responseType: "blob" }),
  convertMultiple: (fd) => api.post("/api/pdf/convert", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }),
};

export const faultApi = {
  getSummary: (p) => api.get("/api/faults/summary", { params: p }),
  getAll:     (p) => api.get("/api/faults", { params: p }),
  create:     (d) => api.post("/api/faults", d),
  update:     (id,d) => api.put(`/api/faults/${id}`, d),
  delete:     (id) => api.delete(`/api/faults/${id}`),
};

export default api;
