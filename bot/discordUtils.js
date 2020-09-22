const MAX_EMBED_COLUMNS = 3; // 3 Max, 2 with Thumbnail (https://discordjs.guide/popular-topics/embeds.html#notes)

const fetchPartialReaction = async (reaction) => {
  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
    } catch {
      console.error("Failed to fetch cached message ID:", reaction.message.id);
    }
  }

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      console.error("Failed to fetch cached reaction ID:", reaction.id);
    }
  }
};

const getEmbed = ({ fields, footer, description = "", timestamp, title }) => {
  const footerObject = footer
    ? {
        text: footer,
      }
    : null;

  return {
    embed: {
      color: 0xcf5a00,
      description,
      fields,
      footer: footerObject,
      timestamp,
      title,
    },
  };
};

const getNicknameFromReaction = (reaction, userId) => {
  return reaction.message.guild.member(userId).displayName;
};

const isMe = (id) => {
  return id === process.env.DISCORD_USER_ID;
};

module.exports = {
  fetchPartialReaction,
  getEmbed,
  getNicknameFromReaction,
  isMe,
  MAX_EMBED_COLUMNS,
};
