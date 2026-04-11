// StudyHub v3 — events/messageCreate.js
// Processa comandos com ! e restringe ao canal #use-aqui
const { ChannelType } = require("discord.js");
const PREFIX = "!";
const ALLOWED_CHANNEL = "use-aqui";

// Comandos que só admins podem usar
const ADMIN_ONLY_COMMANDS = ["clear", "mute", "cargo", "unmute"];

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args        = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command     = client.commands.get(commandName);
    if (!command) return;

    // Verifica se é admin para comandos restritos
    const isAdmin = message.member?.roles.cache.some((r) => r.name === "Admin");
    if (ADMIN_ONLY_COMMANDS.includes(commandName) && !isAdmin) {
      const reply = await message.reply("❌ Este comando é restrito a **@Admin**.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    // Restringe comandos ao canal #use-aqui (exceto admins)
    if (!isAdmin && message.channel.name !== ALLOWED_CHANNEL) {
      const reply = await message.reply(`❌ Use os comandos no canal <#${message.guild.channels.cache.find((c) => c.name === ALLOWED_CHANNEL)?.id || ALLOWED_CHANNEL}>!`);
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[Bot] Erro em !${commandName}:`, err.message);
      message.reply("❌ Erro ao executar o comando.").catch(() => {});
    }
  },
};
