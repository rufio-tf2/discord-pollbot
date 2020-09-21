const {
  handleAddVote,
  handlePoll,
  handleRemoveVote,
  POLL_PREFIXES,
} = require("./poll");
const { handleSlap, SLAP_PREFIXES } = require("./slap");
const { parseArgs, splitFirstSpace } = require("../util");

const onMessage = (message) => {
  const [firstArg, restMessage] = splitFirstSpace(message.content);
  const normalizedFirstArg = firstArg.toLowerCase();

  const isPoll = POLL_PREFIXES.includes(normalizedFirstArg);
  const isSlap = SLAP_PREFIXES.includes(normalizedFirstArg);

  if (isPoll) {
    const args = parseArgs(restMessage);
    handlePoll(message, args);
  } else if (isSlap) {
    handleSlap(message, restMessage);
  } else {
    return;
  }
};

const onChangeReaction = async (reaction, username, action) => {
  handleVote(reaction, username, action);
};

module.exports = {
  handleAddVote,
  handleRemoveVote,
  onMessage,
};
