// ============================================================
// StudyHub — utils/api.js
// Helper para chamadas HTTP ao backend StudyHub
// ============================================================

const https = require("https");
const http = require("http");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Faz uma requisição GET para a API do backend
 * @param {string} path - Caminho da rota (ex: "/api/contents/today")
 * @returns {Promise<object>} Dados da resposta
 */
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
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Resposta inválida do servidor"));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Timeout na requisição"));
    });
    req.end();
  });
};

/**
 * Formata uma data "YYYY-MM-DD" para "DD/MM/YYYY"
 */
const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

/**
 * Retorna o emoji do tipo de conteúdo
 */
const typeEmoji = (type) => {
  const map = { Aula: "📖", Revisão: "🔄", Prova: "📝" };
  return map[type] || "📚";
};

/**
 * Converte cor hex para decimal (para embeds do Discord)
 */
const hexToDecimal = (hex) => parseInt((hex || "#5865F2").replace("#", ""), 16);

module.exports = { apiGet, formatDate, typeEmoji, hexToDecimal };
