// StudyHub v3 — utils/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({ baseURL: BASE_URL, timeout: 12000, headers: { "Content-Type": "application/json" } });

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
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(new Error(err.response?.data?.message || err.message || "Erro de conexão"));
  }
);

export const contentApi = {
  getAll:    (params) => api.get("/api/contents", { params }),
  getById:   (id)     => api.get(`/api/contents/${id}`),
  create:    (data)   => api.post("/api/contents", data),
  update:    (id, d)  => api.put(`/api/contents/${id}`, d),
  delete:    (id)     => api.delete(`/api/contents/${id}`),
};

export const subjectApi = {
  getAll:  ()        => api.get("/api/subjects"),
  create:  (data)    => api.post("/api/subjects", data),
  update:  (id, d)   => api.put(`/api/subjects/${id}`, d),
  delete:  (id)      => api.delete(`/api/subjects/${id}`),
};

export const messageApi = {
  getAll:  ()        => api.get("/api/messages"),
  create:  (data)    => api.post("/api/messages", data),
  delete:  (id)      => api.delete(`/api/messages/${id}`),
};

export const attendanceApi = {
  getAll:  ()        => api.get("/api/attendance"),
  create:  (data)    => api.post("/api/attendance", data),
  update:  (id, d)   => api.put(`/api/attendance/${id}`, d),
  delete:  (id)      => api.delete(`/api/attendance/${id}`),
};

export const galleryApi = {
  getAll:  (params)  => api.get("/api/gallery", { params }),
  upload:  (formData) => api.post("/api/gallery", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete:  (id)      => api.delete(`/api/gallery/${id}`),
};

export const publicApi = {
  getToday:  ()      => api.get("/api/public/today"),
  getAgenda: (p)     => api.get("/api/public/agenda", { params: p }),
  getExams:  ()      => api.get("/api/public/exams"),
};

export default api;
