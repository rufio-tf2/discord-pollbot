const get = require("lodash.get");

const keyv = require("./keyv");

const defaultPoll = {
  channelId: undefined,
  guildId: undefined,
  id: undefined,
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
  const { channelId, guildId, id } = pollData;

  return getDb(guildId).then((guildObject) => {
    return get(guildObject, [channelId, id], {});
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

module.exports = {
  getPoll,
  setPoll,
};
