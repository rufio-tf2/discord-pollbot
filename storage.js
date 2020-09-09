const pollStorage = {};

const includesValue = (message) => {
  const channelMessages = pollStorage[message.guildID][message.channelID];
  return Object.values(channelMessages).includes(message.id);
};

const getPoll = (message, pollId) => {
  return pollStorage[message.guildID][message.channelID][pollId];
};

const storePoll = (message, pollId) => {
  if (!pollStorage[message.guildID]) {
    pollStorage[message.guildID] = {};
  }

  if (!pollStorage[message.guildID][message.channelID]) {
    pollStorage[message.guildID][message.channelID] = {};
  }

  pollStorage[message.guildID][message.channelID][pollId] = message.id;

  return;
};

module.exports = {
  getPoll,
  includesValue,
  storePoll,
};
