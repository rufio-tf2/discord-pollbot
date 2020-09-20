const database = require("../../database");
const { getNicknameFromReaction } = require("../discordUtils");
const { pollToEmbed, getVoteCount } = require("./pollUtils");
const { formatTimeDistance, isNil, markdown } = require("../../util");

const handleUpdatePoll = async (message, pollId) => {
  if (isNil(pollId) || isNaN(pollId)) return;

  const currentPoll = await database.getPoll({
    channelId: message.channel.id,
    guildId: message.channel.guild.id,
    id: pollId,
  });

  if (currentPoll.messageId) {
    let pollMessage;

    try {
      pollMessage = await message.channel.messages.fetch(currentPoll.messageId);
    } catch (error) {
      console.error(
        `[UpdatePoll] Error fetching poll message. Unable to update poll ID ${pollId}`
      );
      return;
    }

    let reactionPromises = pollMessage.reactions.cache.map(
      (cachedReaction) => pollMessage.reactions.f
    );

    const getUpdatedVotesWithReactions = () => {
      return pollMessage.reactions.cache.reduce((acc, reaction) => {
        const emojiReaction = reaction.emoji.name;

        const updatedVoters = reaction.users.cache
          .map((user) => {
            const username = getNicknameFromReaction(reaction, user.id);

            return username !== pollMessage.author.username ? username : false;
          })
          .filter(Boolean);

        return {
          ...acc,
          lastVoter: acc.lastVoter || {
            action: "update",
            username: getNicknameFromReaction(reaction, message.author.id),
          },
          [emojiReaction]: {
            count: updatedVoters.length,
            emoji: emojiReaction,
            voters: updatedVoters,
          },
        };
      }, {});
    };

    const updatedVotes = getUpdatedVotesWithReactions();

    const updatedPoll = {
      ...currentPoll,
      lastVoter: updatedVotes.lastVoter,
      updatedAt: new Date().getTime(),
      votes: Object.fromEntries(
        Object.entries(updatedVotes).filter(([key]) => key !== "lastVoter")
      ),
    };

    const changes = Object.values(updatedPoll.votes).reduce(
      (acc, { count, emoji }) => {
        const currentVoteCount = getVoteCount(currentPoll, emoji);
        return currentVoteCount !== count
          ? [...acc, [emoji, count - currentVoteCount]]
          : acc;
      },
      []
    );

    const changesString = changes
      .map(([emoji, delta]) => `${emoji} (${delta >= 0 ? "+" : ""}${delta})`)
      .join(", ");

    const changesMessage =
      changes.length > 0
        ? `Votes updated for ${changesString}.`
        : `No changes since last update ${formatTimeDistance(
            currentPoll.updatedAt || currentPoll.createdAt
          )} ago.`;

    const updateMessage = [
      `✅ Poll sync'd.`,
      markdown.italicize(changesMessage),
    ].join("\n");

    database
      .setPoll(updatedPoll)
      .then(() =>
        database.getPoll({
          channelId: message.channel.id,
          guildId: message.channel.guild.id,
          id: pollId,
        })
      )
      .then((poll) => {
        pollMessage.edit(pollToEmbed(poll));
      })
      .then(() => {
        message.channel.send(updateMessage);
      });
  }
};

module.exports = handleUpdatePoll;
