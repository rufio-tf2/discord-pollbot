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
  return get(message.channel.guild.id).then((guildObject = {}) => {
    const channelObject = guildObject[message.channel.id] || {};
    return channelObject[id] || {};
  });
};

const setPoll = async (poll) => {
  const { channelId, guildId, id } = poll;

  const guildObject = await get(guildId, {});
  const channelObject = guildObject[channelId] || {};
  const date = new Date();

  return set(guildId, {
    ...guildObject,
    [channelId]: {
      ...channelObject,
      [id]: {
        ...defaultPoll,
        timestamp: date.getTime(),
        ...poll,
      },
    },
  });
};

const addVote = async ({ id, message, reaction, username }) => {
  const currentPoll = await getPoll(message, id);

  const voteEmoji = reaction.emoji.name;

  const voteData = currentPoll.votes[voteEmoji] || {};
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
    votes: updatedVotes,
  };
  return setPoll(updatedPoll);
};

const removeVote = async ({ id, message, reaction, username }) => {
  const currentPoll = await getPoll(message, id);
  const voteEmoji = reaction.emoji.name;

  const voteData = currentPoll.votes[voteEmoji];
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
    votes: updatedVotes,
  });
};

module.exports = {
  addVote,
  getPoll,
  removeVote,
  setPoll,
};
