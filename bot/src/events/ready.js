// StudyHub v3 — events/ready.js
// NOTA: setupServer é chamado pelo index.js via clientReady
// Este arquivo apenas loga que o bot está pronto
module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    // Intencionalmente vazio - lógica de setup está no index.js
  },
};
