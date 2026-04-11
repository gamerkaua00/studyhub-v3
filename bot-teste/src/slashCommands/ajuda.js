const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder().setName("ajuda").setDescription("Lista todos os comandos disponíveis"),
  async execute(interaction) {
    interaction.reply({ ephemeral: true, embeds: [{ title: "📚 StudyHub — Comandos", color: 0x5865F2,
      fields: [
        { name: "📅 `/hoje`",          value: "Conteúdos de hoje",           inline: false },
        { name: "📆 `/agenda`",        value: "Próximos conteúdos",          inline: false },
        { name: "📝 `/provas`",        value: "Provas com contagem",         inline: false },
        { name: "📊 `/status`",        value: "Status do bot",               inline: false },
        { name: "🛡️ `/clear`",         value: "Apaga mensagens (admin)",     inline: false },
        { name: "🛡️ `/mute`",          value: "Silencia membro (admin)",     inline: false },
        { name: "🛡️ `/cargo`",         value: "Atribui cargo (admin)",       inline: false },
      ],
      footer: { text: "StudyHub v3" }, timestamp: new Date().toISOString() }] });
  },
};
