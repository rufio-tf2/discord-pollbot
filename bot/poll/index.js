const handlePoll = require("./handlePoll");
const { handleAddVote, handleRemoveVote } = require("./handleVote");

const POLL_PREFIXES = ["!poll", "!p"];

module.exports = {
  handleAddVote,
  handlePoll,
  handleRemoveVote,
  POLL_PREFIXES,
};
