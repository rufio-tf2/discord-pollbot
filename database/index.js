const get = require("lodash.get");

const keyv = require("./keyv");

const defaultPoll = {
  channelId: undefined,
  guildId: undefined,
  messageId: undefined,
  options: [],
  prompt: "",
  votes: {},
};

const getDb = (key, defaultValue) => {
  return keyv.get(key).then((value) => {
    return value ? JSON.parse(value) : defaultValue;
  });
};

const setDb = (key, value) => {
  return keyv.set(key, JSON.stringify(value));
};

const getPoll = (pollData) => {
  const { channelId, guildId, messageId } = pollData;

  return getDb(guildId).then((guildObject) => {
    return get(guildObject, [channelId, messageId], {});
  });
};

const setPoll = async (poll) => {
  const { channelId, guildId, messageId } = poll;

  const guildObject = await getDb(guildId, {});
  const channelObject = get(guildObject, channelId, {});

  return setDb(guildId, {
    ...guildObject,
    [channelId]: {
      ...channelObject,
      [messageId]: {
        ...defaultPoll,
        ...poll,
      },
    },
  });
};

module.exports = {
  getPoll,
  setPoll,
};
