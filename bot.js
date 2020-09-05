const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const getCountEmoji = require("./getCountEmoji");
const {
  markdown,
  oxfordJoin,
  stripLeadingTrailingQuotes,
  underDash,
} = require("./util");

const promiseQueue = new PQueue({ concurrency: 1 });

const POLL_PREFIXES = ["!poll", "!p"];
const SLAP_PREFIXES = ["!slap", "!s"];

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const loadSlapHelpMessage = () => {
  return fs.readFile("./helpMessages/SlapHelpMessage.md", "utf8");
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
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [pollPrompt, ...pollOptions] = args;

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
    const helpMessage = await loadPollHelpMessage();

    message.channel.send(
      getEmbed({
        message: helpMessage,
        title: underDash("Poll Command"),
      })
    );
  }
};

const handleSlap = async (message, targets) => {
  const hasTargets = targets.length > 0;

  if (hasTargets) {
    const contents = markdown.italicize(
      `SlapBot slaps ${oxfordJoin(targets)}.`
    );
    message.channel.send(contents);
  } else {
    const helpMessage = await loadSlapHelpMessage();

    message.channel.send(
      getEmbed({
        message: helpMessage,
        title: underDash(`Slap Command`),
      })
    );
  }
};

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
