// StudyHub v3 — events/voiceStateUpdate.js
// Avisa no geral quando alguém entra em sala de voz
const { ChannelType } = require("discord.js");

module.exports = {
  name: "voiceStateUpdate",
  once: false,
  async execute(oldState, newState, client) {
    // Entrou em uma sala
    if (!oldState.channelId && newState.channelId) {
      const channel = newState.channel;
      if (!channel?.name.includes("Sala")) return;

      const guild    = newState.guild;
      const channels = await guild.channels.fetch();
      const useAqui  = channels.find((c) => c.name === "use-aqui" && c.type === ChannelType.GuildText);

      if (useAqui) {
        await useAqui.send({
          embeds: [{
            description: `📖 **${newState.member.user.username}** entrou em **${channel.name}**`,
            color: 0x9B59B6,
          }],
        }).catch(() => {});
      }
    }
  },
};
