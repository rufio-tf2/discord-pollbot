const fs = require("./fileSystem");
const getEmoji = require("./getEmoji");
const util = require("./util");

module.exports = {
  fs,
  ...getEmoji,
  ...util,
};
