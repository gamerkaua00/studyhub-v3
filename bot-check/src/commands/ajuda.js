// ============================================================
// StudyHub — commands/ajuda.js
// !ajuda → lista todos os comandos disponíveis
// ============================================================

module.exports = {
  name: "ajuda",
  description: "Mostra todos os comandos do StudyHub",

  async execute(message) {
    await message.reply({
      embeds: [{
        title: "📚 StudyHub — Central de Ajuda",
        description: "Bot de gerenciamento de estudos integrado com a plataforma web.",
        color: 0x5865F2,
        fields: [
          {
            name: "📅 `!hoje`",
            value: "Exibe todos os conteúdos agendados para o dia atual.",
            inline: false,
          },
          {
            name: "📆 `!agenda [número]`",
            value: "Mostra os próximos conteúdos. Use `!agenda 10` para ver mais itens. (padrão: 7)",
            inline: false,
          },
          {
            name: "📝 `!provas`",
            value: "Lista todas as provas futuras com contagem regressiva e indicador de urgência.",
            inline: false,
          },
          {
            name: "❓ `!ajuda`",
            value: "Exibe esta mensagem de ajuda.",
            inline: false,
          },
        ],
        footer: {
          text: "StudyHub • Notificações automáticas são enviadas no horário cadastrado",
        },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};
