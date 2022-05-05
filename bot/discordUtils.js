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

const toEmbedObject = ({
  description = "",
  fields,
  footer,
  timestamp,
  title,
}) => {
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

const getNicknameFromReaction = async (reaction, userId) => {
  const user = await reaction.message.guild.members.fetch(userId);

  return user
    ? user.displayName
      ? user.displayName
      : user.nickname
    : "Unidentified Toaster";
};

const isMe = (id) => {
  return id === process.env.BOT_APPLICATION_ID;
};

module.exports = {
  fetchPartialReaction,
  toEmbedObject,
  getNicknameFromReaction,
  isMe,
  MAX_EMBED_COLUMNS,
};
