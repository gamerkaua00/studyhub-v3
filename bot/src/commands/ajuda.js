module.exports = {
  name: "ajuda",
  async execute(message) {
    message.reply({ embeds: [{ title: "📚 StudyHub — Ajuda", description: "Use os comandos abaixo (ou `/comando`):", color: 0x5865F2,
      fields: [
        { name: "📅 `!hoje`",    value: "Conteúdos de hoje",             inline: false },
        { name: "📆 `!agenda`",  value: "Próximos conteúdos",            inline: false },
        { name: "📝 `!provas`",  value: "Provas futuras",                inline: false },
        { name: "❓ `!ajuda`",   value: "Esta mensagem",                 inline: false },
      ],
      footer: { text: "StudyHub v3 • Use apenas em #use-aqui" }, timestamp: new Date().toISOString() }] });
  },
};
