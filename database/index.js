const keyv = require("./keyv");

const { isNil } = require("../util");

const defaultPoll = {
  channelId: undefined,
  guildId: undefined,
  id: undefined,
  messageId: undefined,
  options: [],
  prompt: "",
  votes: {},
};

const set = (key, value) => {
  return keyv.set(key, JSON.stringify(value));
};

const get = (key, defaultValue) => {
  return keyv.get(key).then((value) => {
    return value ? JSON.parse(value) : defaultValue;
  });
};

const getPoll = (message, id) => {
  return get(message.channel.guild.id).then((guildObject) => {
    return guildObject?.[message.channel.id]?.[id] ?? {};
  });
};

const setPoll = async (poll) => {
  const { channelId, guildId, id } = poll;

  const guildObject = await get(guildId, {});
  const channelObject = guildObject[channelId] ?? {};

  return set(guildId, {
    ...guildObject,
    [channelId]: {
      ...channelObject,
      [id]: {
        ...defaultPoll,
        ...poll,
      },
    },
  });
};

const addVote = async ({ id, message, reaction, username }) => {
  const currentPoll = await getPoll(message, id);

  const voteEmoji = reaction.emoji.name;

  const voteData = currentPoll.votes[voteEmoji] ?? {};
  const { voters = [] } = voteData;

  const updatedVoters = voters.includes(username)
    ? voters
    : [...voters, username];

  const updatedVotes = {
    ...currentPoll.votes,
    [voteEmoji]: {
      ...voteData,
      emoji: voteEmoji,
      voters: updatedVoters,
      count: updatedVoters.length,
    },
  };

  const updatedPoll = {
    ...currentPoll,
    lastVoter: { action: "cast", username },
    updatedAt: new Date().getTime(),
    votes: updatedVotes,
  };
  return setPoll(updatedPoll);
};

const removeVote = async ({ id, message, reaction, username }) => {
  const currentPoll = await getPoll(message, id);
  const voteEmoji = reaction.emoji.name;

  const voteData = currentPoll.votes[voteEmoji] ?? {};
  const { voters = [] } = voteData;

  const updatedVoters = voters.filter((voter) => voter !== username);

  const updatedVotes = {
    ...currentPoll.votes,
    [voteEmoji]: {
      ...voteData,
      voters: updatedVoters,
      count: updatedVoters.length,
    },
  };

  return setPoll({
    ...currentPoll,
    lastVoter: { action: "removed", username },
    updatedAt: new Date().getTime(),
    votes: updatedVotes,
  });
};

module.exports = {
  addVote,
  getPoll,
  removeVote,
  setPoll,
};
