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

const getPoll = (id, message) => {
  return get(message.guildID).then((guildObject = {}) => {
    const channelObject = guildObject[message.channelID] || {};
    return channelObject[id] || {};
  });
};

const setPoll = async (id, message, poll) => {
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
  return setPoll(id, message, {
    messageId: message.id,
    options,
    pollId: id,
    prompt,
    votes,
  });
};

const addVote = async ({ id, message, voteEmoji, username }) => {
  const currentPoll = await getPoll(id, message);

  const updatedOptionsCount = currentPoll.options.map(
    ({ emoji, option, count = 0 }) => {
      return emoji === voteEmoji
        ? { emoji, option, count: count + 1 }
        : { emoji, option, count };
    }
  );

  const voteData = currentPoll.votes[voteEmoji] || {};
  const { voters = [] } = voteData;

  const updatedVotes = {
    ...currentPoll.votes,
    [voteEmoji]: {
      ...voteData,
      emoji: voteEmoji,
      voters: voters.includes(username) ? voters : [...voters, username],
    },
  };

  const updatedPoll = {
    ...currentPoll,
    options: updatedOptionsCount,
    votes: updatedVotes,
  };
  return setPoll(id, message, updatedPoll);
};

const removeVote = async ({ id, message, voteEmoji, username }) => {
  const currentPoll = await getPoll(id, message);

  const updatedOptionsCount = currentPoll.options.map(
    ({ emoji, option, count = 0 }) => {
      return emoji === voteEmoji
        ? { emoji, option, count: Math.max(0, count - 1) }
        : { emoji, option, count };
    }
  );

  const voteData = currentPoll.votes[voteEmoji] || {};
  const { voters = [] } = voteData;

  const updatedVotes = {
    ...currentPoll.votes,
    [voteEmoji]: {
      ...voteData,
      voters: voters.filter((voter) => voter !== username),
    },
  };

  return setPoll(id, message, {
    ...currentPoll,
    options: updatedOptionsCount,
    votes: updatedVotes,
  });
};

module.exports = {
  addVote,
  getPoll,
  removeVote,
  storePoll,
};
