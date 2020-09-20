const handlePoll = require("./handlePoll");
const handleUpdatePoll = require("./handleUpdatePoll");
const { handleAddVote, handleRemoveVote } = require("./handleVote");

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
  handleAddVote,
  handlePoll,
  handleRemoveVote,
  handleUpdatePoll,
  POLL_PREFIXES,
  UPDATE_POLL_PREFIXES,
};
