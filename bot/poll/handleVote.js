const get = require("lodash.get");

const database = require("../../database");
const { pollToEmbed } = require("./pollUtils");
const { getNicknameFromReaction } = require("../discordUtils");

const fetchPollFromReaction = async (reaction) => {
  const message = reaction.message;
  const currentEmbed = message.embeds[0];

  if (!currentEmbed) return;

  try {
    const pollData = {
      channelId: message.channel.id,
      guildId: message.channel.guild.id,
      messageId: message.id,
    };

    return database.getPoll(pollData);
  } catch (error) {
    console.error(
      `[fetchPollFromReaction] Error getting poll message ${
        message.id
      } from database. ${JSON.stringify(pollData, null, 2)}`
    );
    return error;
  }
};

const handleAddVote = async (reaction, user) => {
  const username = getNicknameFromReaction(reaction, user.id);

  if (username === reaction.message.author.username) return;

  let poll;

  try {
    poll = await fetchPollFromReaction(reaction);
  } catch (error) {
    console.error(`[handleAddVote] Error adding vote by ${username}.`);
  }

  if (!poll || !poll.prompt || !poll.prompt.length > 0) {
    console.error("[handleAddVote] No poll found.");
    return;
  }

  const voteEmoji = reaction.emoji.name;

  const voteData = get(poll, ["votes", voteEmoji], {});
  const { voters = [] } = voteData;

  const updatedVoters = voters.includes(username)
    ? voters
    : [...voters, username];

  const updatedVotes = {
    ...poll.votes,
    [voteEmoji]: {
      ...voteData,
      emoji: voteEmoji,
      voters: updatedVoters,
      count: updatedVoters.length,
    },
  };

  const updatedPoll = {
    ...poll,
    lastVoter: { action: "cast", username },
    updatedAt: new Date().getTime(),
    votes: updatedVotes,
  };

  return database.setPoll(updatedPoll).then(() => {
    reaction.message.edit(pollToEmbed(updatedPoll));
  });
};

const handleRemoveVote = async (reaction, user) => {
  const username = getNicknameFromReaction(reaction, user.id);

  if (username === reaction.message.author.username) return;

  let poll;

  try {
    poll = await fetchPollFromReaction(reaction);
  } catch (error) {
    console.error(`[handleRemoveVote] Error removing vote by ${username}.`);
  }

  if (!poll) {
    console.error("[handleRemoveVote] No poll found.");
    return;
  }

  const voteEmoji = reaction.emoji.name;

  const voteData = get(poll, ["votes", voteEmoji], {});
  const { voters = [] } = voteData;

  const updatedVoters = voters.filter((voter) => voter !== username);

  const updatedVotes = {
    ...poll.votes,
    [voteEmoji]: {
      ...voteData,
      voters: updatedVoters,
      count: updatedVoters.length,
    },
  };

  const updatedPoll = {
    ...poll,
    lastVoter: { action: "removed", username },
    updatedAt: new Date().getTime(),
    votes: updatedVotes,
  };

  return database.setPoll(updatedPoll).then(() => {
    reaction.message.edit(pollToEmbed(updatedPoll));
  });
};

module.exports = {
  handleAddVote,
  handleRemoveVote,
};
