const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const getCountEmoji = require("./getCountEmoji");
const {
  isUndefined,
  mapString,
  stripLeadingTrailingQuotes,
} = require("./util");

const promiseQueue = new PQueue({ concurrency: 1 });

const POLL_PREFIXES = ["!poll", "!p"];
const SLAP_PREFIXES = ["!slap", "!s"];

const underDash = (str) => {
  return `${str}\n${mapString(str, (char) => "-")}`;
};

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const getEmbed = ({ message = "", title }) => {
  return {
    embed: {
      color: 0xcf5a00,
      description: message,
      title,
    },
  };
};

const handlePoll = async (message, args) => {
  const [pollPrompt, ...pollOptions] = args;
  const hasArgs = !isUndefined(pollPrompt);

  if (hasArgs) {
    const isBoolean =
      pollOptions.length <= 2 &&
      pollOptions.some((option) =>
        ["yes", "no", "true", "false"].includes(option.toLowerCase())
      );

    let optionPairs;
    let embedText;

    if (isBoolean) {
      optionPairs = [["✅"], ["❌"]];
    } else {
      optionPairs = pollOptions.map((option, index) => [
        getCountEmoji(index + 1),
        option,
      ]);

      embedText = optionPairs
        .map(([emoji, option]) => `${emoji} - ${option}`)
        .join("\n");
    }

    const embedContents = getEmbed({
      message: embedText,
      title: pollPrompt,
    });

    const pollEmbed = await message.channel.send(embedContents);

    promiseQueue.addAll(
      optionPairs.map(([emoji], index) => async () => {
        await pollEmbed.react(emoji);
      })
    );
  } else {
    const pollHelpMessage = await loadPollHelpMessage();

    message.channel.send(
      getEmbed({
        message: pollHelpMessage,
        title: underDash("Poll Help"),
      })
    );
  }
};

const handleSlap = (message, targets) => {};

const delegateTask = (message) => {
  const [firstArg, ...args] = message.content
    ? message.content
        .trim()
        .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
        .map(stripLeadingTrailingQuotes)
    : [];

  const isPoll = POLL_PREFIXES.includes(firstArg);
  const isSlap = SLAP_PREFIXES.includes(firstArg);

  if (isPoll) {
    handlePoll(message, args);
  } else if (isSlap) {
    handleSlap(message, args);
  } else {
    return;
  }
};

module.exports = { delegateTask };
