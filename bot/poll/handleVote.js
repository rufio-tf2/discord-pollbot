const database = require("../../database");
const { pollToEmbed } = require("./pollUtils");

const POLL_ID_SCHEMA = /POLL_ID:\s(?<pollId>\d+)/;

const handleVote = (reaction, username, action) => {
  const message = reaction.message;
  const currentEmbed = message.embeds[0];

  if (username !== message.author.username) {
    const { pollId } =
      currentEmbed.footer.text.match(POLL_ID_SCHEMA).groups || {};

    const databaseAction =
      action === "remove" ? database.removeVote : database.addVote;

    databaseAction({
      id: pollId,
      message,
      reaction,
      username,
    })
      .then(() => database.getPoll(message, pollId))
      .then((updatedPoll) => {
        message.edit(pollToEmbed(updatedPoll));
      });
  }
};

module.exports = handleVote;
