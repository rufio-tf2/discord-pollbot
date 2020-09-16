const keyv = require("./keyv");
const get = require("lodash.get");

const defaultPoll = {
  channelId: undefined,
  guildId: undefined,
  id: undefined,
  messageId: undefined,
  options: [],
  prompt: "",
  votes: {},
};

const setDb = (key, value) => {
  console.log("@@SET", { key, value });
  return keyv.set(key, JSON.stringify(value));
};

const getDb = (key, defaultValue) => {
  console.log("@@GET", { key, value });
  return keyv.get(key).then((value) => {
    return value ? JSON.parse(value) : defaultValue;
  });
};

const getPoll = (message, id) => {
  return getDb(message.channel.guild.id).then((guildObject) => {
    const poll = get(guildObject, [message.channel.id, id], {});
    return poll;
  });
};

const setPoll = async (poll) => {
  const { channelId, guildId, id } = poll;

  const guildObject = await getDb(guildId, {});
  const channelObject = get(guildObject, channelId, {});

  return setDb(guildId, {
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

  const voteData = get(currentPoll, ["votes", voteEmoji], {});
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

  const voteData = get(currentPoll, ["votes", voteEmoji], {});
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
