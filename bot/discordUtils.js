const MAX_EMBED_COLUMNS = 3; // 3 Max, 2 with Thumbnail (https://discordjs.guide/popular-topics/embeds.html#notes)

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

module.exports = { getEmbed, getNicknameFromReaction, MAX_EMBED_COLUMNS };
