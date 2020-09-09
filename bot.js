const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const { emojisByKey, getPollEmoji } = require("./getEmoji");
const storage = require("./storage");
const {
  endsWithPunctuation,
  markdown,
  parseArgs,
  splitFirstSpace,
  underDash,
  uniqueId,
} = require("./util");

const POLL_PREFIXES = ["!poll", "!p"];
const SLAP_PREFIXES = ["!slap"];
// const JOIN_EMOJI_OPTION_TOKEN = " - ";
const OPTION_SCHEMA = /^(?<emoji>.*) - (?<option>.*) \((?<count>.*)\)$/;

const promiseQueue = new PQueue({ concurrency: 1 });

const toPairText = ([emoji, option, count = 0]) => {
  return `${emoji} - ${option} (${count})`;
};

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const loadSlapHelpMessage = () => {
  return fs.readFile("./helpMessages/SlapHelpMessage.md", "utf8");
};

const getEmbed = ({ fields, footer, description = "", title }) => {
  const footerObject = footer
    ? {
        text: footer,
      }
    : null;

  return {
    embed: {
      color: 0xcf5a00,
      description,
      title,
      footer: footerObject,
    },
  };
};

const handlePollResults = async (message, args) => {
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [pollId] = args;
  }
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
      optionPairs = [
        [emojisByKey["yes"], "true"],
        [emojisByKey["no"], "false"],
      ];
    } else if (isYesNo) {
      const includeMaybe = pollOptions.some((option) =>
        ["maybe"].includes(option.toLowerCase())
      );

      optionPairs = [
        [emojisByKey["yes"], "true"],
        [emojisByKey["no"], "false"],
      ];

      optionPairs = includeMaybe
        ? [...optionPairs, [emojisByKey["maybe"], "maybe"]]
        : optionPairs;
    } else {
      optionPairs = pollOptions.map((option, index) => [
        getPollEmoji(index + 1),
        option,
      ]);
    }

    embedText = optionPairs.map(toPairText).join("\n");
    const pollId = uniqueId();

    const pollEmbedMessage = await message.channel.send(
      getEmbed({
        footer: pollId,
        description: embedText,
        title: pollPrompt,
      })
    );

    promiseQueue.addAll(
      optionPairs.map(([emoji]) => async () => {
        await pollEmbedMessage.react(emoji);
      })
    );

    storage.storePoll(pollEmbedMessage, pollId);
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
        description: helpMessage,
        title: underDash(`Slap Command`),
      })
    );
  }
};

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

const parseDescription = (description = "") => {
  return description
    .split("\n")
    .map((option) => Array.from(option.match(OPTION_SCHEMA).slice(1)));
};

// const parseField =

const onChangeReaction = async (reaction, user) => {
  const message = reaction.message;
  const currentEmbed = message.embeds[0];

  reaction.emoji && console.log(reaction.emoji);

  if (storage.includesValue(message)) {
    const currentOptionPairs = parseDescription(currentEmbed.description);

    const updatedDescription = currentOptionPairs
      .map(([emoji, option, oldCount]) => {
        const newCount =
          reaction.emoji.name === emoji ? reaction.count - 1 : oldCount;
        return toPairText([emoji, option, newCount]);
      })
      .join("\n");

    // const currentFieldPairs = parseField();

    await message.edit(
      getEmbed({
        ...currentEmbed,
        description: updatedDescription,
        // fields,
      })
    );
  }
};

module.exports = {
  onChangeReaction,
  onMessage,
};
