const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const { emojisByKey, getCountEmoji } = require("./getCountEmoji");
const {
  endsWithPunctuation,
  markdown,
  minutesToMilliseconds,
  parseArgs,
  splitFirstSpace,
  underDash,
} = require("./util");

const promiseQueue = new PQueue({ concurrency: 1 });

const POLL_PREFIXES = ["!poll", "!p"];
const SLAP_PREFIXES = ["!slap"];

const booleanPairs = [["✅"], ["❌"]];

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const loadSlapHelpMessage = () => {
  return fs.readFile("./helpMessages/SlapHelpMessage.md", "utf8");
};

const getEmbed = ({ footer, message = "", title }) => {
  const footerObject = footer
    ? {
        text: footer,
      }
    : null;

  return {
    embed: {
      color: 0xcf5a00,
      description: message,
      title,
      footer: footerObject,
    },
  };
};

const handlePoll = async (message, args) => {
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [pollPrompt, ...pollOptions] = args;

    const isYesNo =
      pollOptions.length <= 3 &&
      pollOptions.some((option) =>
        ["yes", "no", "maybe"].includes(option.toLowerCase())
      );

    const isTrueFalse =
      pollOptions.length <= 2 &&
      pollOptions.some((option) =>
        ["true", "false"].includes(option.toLowerCase())
      );

    let optionPairs;
    let embedText;

    if (isTrueFalse) {
      optionPairs = booleanPairs;
    } else if (isYesNo) {
      const includeMaybe = pollOptions.some((option) =>
        ["maybe"].includes(option.toLowerCase())
      );

      optionPairs = includeMaybe ? [...booleanPairs, ["❔"]] : booleanPairs;
    } else {
      optionPairs = pollOptions.map((option, index) => [
        getCountEmoji(index + 1),
        option,
      ]);

      embedText = optionPairs
        .map(([emoji, option]) => `${emoji} - ${option}`)
        .join("\n");
    }

    const pollEmbed = await message.channel.send(
      getEmbed({
        message: embedText,
        title: pollPrompt,
      })
    );

    promiseQueue.addAll(
      optionPairs.map(([emoji]) => async () => {
        await pollEmbed.react(emoji);
      })
    );

    const isPollReaction = (reaction, user) => {
      return optionPairs.some(([emoji]) => {
        return reaction.emoji.name === emoji;
      });
    };
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

const handleSlap = async (message, target = "") => {
  const hasTarget = target.length > 0;

  if (hasTarget) {
    const punctuation = endsWithPunctuation(target) ? "" : ".";
    const slapMessage = `SlapBot slaps ${target}${punctuation}`;
    message.channel.send(markdown.italicize(slapMessage));
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

module.exports = { delegateTask };
