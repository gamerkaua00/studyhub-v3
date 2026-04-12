// StudyHub v3.1.2 — utils/colorUtils.js
// Calcula se o texto deve ser preto ou branco com base na cor de fundo

/**
 * Calcula a luminância relativa de uma cor hex
 * @param {string} hex — ex: "#FEE75C" ou "#5865F2"
 * @returns {number} luminância entre 0 (preto) e 1 (branco)
 */
export const getLuminance = (hex) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substr(0, 2), 16) / 255;
  const g = parseInt(clean.substr(2, 2), 16) / 255;
  const b = parseInt(clean.substr(4, 2), 16) / 255;
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Retorna "#000000" ou "#ffffff" dependendo do contraste ideal
 * @param {string} bgHex — cor de fundo em hex
 * @returns {"#000000"|"#ffffff"}
 */
export const getTextColor = (bgHex) => {
  if (!bgHex || !bgHex.startsWith("#")) return "#ffffff";
  try {
    const lum = getLuminance(bgHex);
    return lum > 0.35 ? "#000000" : "#ffffff";
  } catch { return "#ffffff"; }
};

/**
 * Converte cor hex para rgba com opacidade
 */
export const hexToRgba = (hex, alpha = 1) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substr(0, 2), 16);
  const g = parseInt(clean.substr(2, 2), 16);
  const b = parseInt(clean.substr(4, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Mapa de cores por tipo de conteúdo
 */
export const TYPE_COLORS = {
  Aula:         "#5865F2",
  Revisão:      "#57F287",
  Prova:        "#ED4245",
  Apresentação: "#EB459E",
  Atividade:    "#FEE75C",
  Avaliação:    "#E67E22",
  Lista:        "#9B59B6",
};

export const TYPE_EMOJI = {
  Aula:"📖", Revisão:"🔄", Prova:"📝", Apresentação:"🎤", Atividade:"📋", Avaliação:"📊", Lista:"📃",
};
