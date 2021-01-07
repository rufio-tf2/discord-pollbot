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

const getNicknameFromReaction = (reaction, userId) => {
  // If async is necessary:
  // const user = await reaction.message.guild.members.fetch(userId);

  const user = reaction.message.guild.members.cache.find(
    (member) => member.id === userId
  );

  return user ? user.displayName : "Unidentified Toaster";
};

const isMe = (id) => {
  return id === process.env.DISCORD_USER_ID;
};

module.exports = {
  fetchPartialReaction,
  toEmbedObject,
  getNicknameFromReaction,
  isMe,
  MAX_EMBED_COLUMNS,
};
