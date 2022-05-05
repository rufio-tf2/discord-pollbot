const get = require("lodash.get");

const {
  buildPollFromMessage,
  isReactionToPoll,
  pollToEmbed,
} = require("./pollUtils");
const { getNicknameFromReaction, isMe } = require("../discordUtils");

onMessageReaction = async (reaction, user) => {
  const isReactionMine = isMe(user.id);

  if (!isReactionToPoll(reaction) || isReactionMine) {
    return;
  }

  const constructedPoll = await buildPollFromMessage(reaction.message);

  if (!constructedPoll) {
    console.error(
      "[onMessageReaction] Error constructing poll from message",
      reaction.message.id
    );
    return;
  }

  const userDisplayName = await getNicknameFromReaction(reaction, user.id);

  const poll = {
    ...constructedPoll,
    lastVoter: { username: userDisplayName },
  };

  reaction.message.edit(pollToEmbed(poll));
};

const handleAddVote = (reaction, user) => {
  return onMessageReaction(reaction, user);
};

const handleRemoveVote = (reaction, user) => {
  return onMessageReaction(reaction, user);
};

module.exports = {
  handleAddVote,
  handleRemoveVote,
};
