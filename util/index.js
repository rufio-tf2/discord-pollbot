const dateTime = require("./dateTime");
const fs = require("./fileSystem");
const getEmoji = require("./getEmoji");
const promiseQueue = require("./promiseQueue");
const util = require("./util");

module.exports = {
  ...dateTime,
  ...getEmoji,
  ...util,
  fs,
  promiseQueue,
};
