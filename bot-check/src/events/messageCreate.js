// ============================================================
// StudyHub — events/messageCreate.js
// Interpreta mensagens e despacha comandos com prefixo "!"
// ============================================================

const PREFIX = "!";

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    // Ignora bots e mensagens sem o prefixo
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    // Extrai nome do comando e argumentos
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    // Busca o comando na coleção
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      console.log(`[Bot] Comando recebido: !${commandName} por ${message.author.tag}`);
      await command.execute(message, args);
    } catch (err) {
      console.error(`[Bot] Erro ao executar !${commandName}:`, err.message);
      await message.reply("❌ Ocorreu um erro ao executar este comando. Tente novamente.");
    }
  },
};
