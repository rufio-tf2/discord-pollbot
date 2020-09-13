const database = require("../../database");
const { fs, promiseQueue, underDash, uniqueId } = require("../../util");
const { buildOptions, pollToEmbed } = require("./pollUtils");
const { getEmbed } = require("../discordUtils");

const OPTION_SCHEMA = /^(?<emoji>.*) - (?<option>.*) \((?<count>.*)\)$/;

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const handlePoll = async (message, args) => {
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [prompt, ...pollOptions] = args;

    const options = buildOptions(pollOptions);

    const pollId = uniqueId();

    const pollEmbed = pollToEmbed({
      id: pollId,
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

      database.setPoll({
        channelId: pollEmbedMessage.channel.id,
        guildId: pollEmbedMessage.channel.guild.id,
        id: pollId,
        messageId: pollEmbedMessage.id,
        options,
        prompt: prompt,
        createdAt: new Date().getTime(),
      });
    } catch (error) {
      console.error("Error saving new poll. ", error);
    }
  } else {
    const helpMessage = await loadPollHelpMessage();

    message.channel.send(
      getEmbed({
        description: helpMessage,
        title: underDash("Poll Command"),
      })
    );
  }
};

module.exports = handlePoll;
