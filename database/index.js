const keyv = require("./keyv");
// const { isNil } = require("./util");

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

const addVote = async ({ id, message, voteOption, username }) => {
  const currentPoll = await getPoll(id, message);

  const updatedOptionsCount = currentPoll.options.map(
    ([emoji, option, count = 0]) => {
      return emoji === voteOption
        ? [emoji, option, count + 1]
        : [emoji, option, count];
    }
  );

  const currentListOfNames = currentPoll.votes[voteOption] || [];

  updatedVotes = {
    ...currentPoll.votes,
    [voteOption]: currentListOfNames.includes(username)
      ? currentListOfNames
      : [...currentListOfNames, username],
  };

  return setPoll(id, message, {
    ...currentPoll,
    options: updatedOptionsCount,
    votes: updatedVotes,
  });
};

const removeVote = async ({ id, message, voteOption, username }) => {
  const currentPoll = await getPoll(id, message);
  const currentVotePairs = Object.entries(currentPoll.votes);

  const updatedOptionsCount = currentPoll.options.map(
    ([emoji, option, count = 0]) => {
      return emoji === voteOption
        ? [emoji, option, Math.max(0, count - 1)]
        : [emoji, option, count];
    }
  );

  const updatedVotePairs = currentVotePairs
    .map(([category, listOfNames]) => {
      if (category === voteOption) {
        const updatedListOfNames = listOfNames.filter(
          (name) => name !== username
        );

        return updatedListOfNames.length > 0
          ? [category, updatedListOfNames]
          : false;
      }

      return [category, listOfNames];
    })
    .filter(Boolean);

  return setPoll(id, message, {
    ...currentPoll,
    options: updatedOptionsCount,
    votes: Object.fromEntries(updatedVotePairs),
  });
};

module.exports = {
  addVote,
  getPoll,
  removeVote,
  storePoll,
};
