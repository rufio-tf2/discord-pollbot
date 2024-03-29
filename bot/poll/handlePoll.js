const { fs, promiseQueue, underDash } = require("../../util");
const { buildOptions, pollToEmbed } = require("./pollUtils");
const { toEmbedObject } = require("../discordUtils");

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const handlePoll = async (message, args) => {
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [prompt, ...pollOptions] = args;

    const options = buildOptions(pollOptions);

    const createdAt = new Date().getTime();

    const pollEmbed = pollToEmbed({
      createdAt,
      options,
      prompt,
    });

    try {
      const pollEmbedMessage = await message.channel.send(pollEmbed);

      promiseQueue.addAll(
        Object.values(
          options.map(({ emoji }) => async () => {
            await pollEmbedMessage.react(emoji);
          })
        )
      );
    } catch (error) {
      console.error("Error saving new poll. ", error);
    }
  } else {
    const helpMessage = await loadPollHelpMessage();

    message.channel.send(
      toEmbedObject({
        description: helpMessage,
        title: underDash("Poll Command"),
      })
    );
  }
};

module.exports = handlePoll;
