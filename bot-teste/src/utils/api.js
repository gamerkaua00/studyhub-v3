// StudyHub v3 — utils/api.js
const https = require("https");
const http  = require("http");
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const apiGet = (path) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + path);
    const lib = url.protocol === "https:" ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("Resposta inválida")); } });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.end();
  });
};

const formatDate = (dateStr) => { const [y, m, d] = dateStr.split("-"); return `${d}/${m}/${y}`; };
const typeEmoji  = (type) => ({ "Aula": "📖", "Revisão": "🔄", "Prova": "📝" }[type] || "📚");
const daysUntil  = (dateStr) => {
  const now   = new Date();
  const brt   = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const today = brt.toISOString().split("T")[0];
  return Math.round((new Date(dateStr + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000);
};

module.exports = { apiGet, formatDate, typeEmoji, daysUntil };
