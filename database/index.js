const keyv = require("./keyv");

const set = (key, value) => {
  return keyv.set(key, JSON.stringify(value));
};

const get = (key) => {
  return keyv.get(key).then((value) => {
    return value ? JSON.parse(value) : undefined;
  });
};

const getDefault = (key, defaultValue) => {
  return get(key).then((value = defaultValue) => {
    return value;
  });
};

const getPoll = (message, id) => {
  return get(message.guildID).then((guildObject = {}) => {
    const channelObject = guildObject[message.channelID] || {};
    return channelObject[id] || {};
  });
};

const setPoll = async (message, id, poll) => {
  const guildObject = await getDefault(message.guildID, {});
  const channelObject = guildObject[message.channelID] || {};

  return set(message.guildID, {
    ...guildObject,
    [message.channelID]: {
      ...channelObject,
      [id]: poll,
    },
  });
};

const storePoll = ({ id, message, options, prompt, votes = {} }) => {
  return setPoll(message, id, {
    messageID: message.id,
    options,
    pollId: id,
    prompt,
    votes,
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
  return setPoll(message, id, updatedPoll);
};

const removeVote = async ({ id, message, reaction, username }) => {
  const currentPoll = await getPoll(message, id);
  const voteEmoji = reaction.emoji.name;

  const voteData = currentPoll.votes[voteEmoji] || {};
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

  return setPoll(message, id, {
    ...currentPoll,
    votes: updatedVotes,
  });
};

module.exports = {
  addVote,
  getPoll,
  removeVote,
  setPoll,
  storePoll,
};
