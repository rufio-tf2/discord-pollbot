const handlePoll = require("./handlePoll");
const handleUpdatePoll = require("./handleUpdatePoll");
const handleVote = require("./handleVote");

const POLL_PREFIXES = ["!poll", "!p"];
const UPDATE_POLL_PREFIXES = [
  "!psync",
  "!syncpoll",
  "!up",
  "!updatepoll",
  "!votesync",
  "!vsync",
];

module.exports = {
  handlePoll,
  handleUpdatePoll,
  handleVote,
  POLL_PREFIXES,
  UPDATE_POLL_PREFIXES,
};
