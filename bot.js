const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const { emojisByKey, getPollEmoji } = require("./getEmoji");
const database = require("./database");
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
const POLL_DIVIDER = "-----";

const OPTION_SCHEMA = /^(?<emoji>.*) - (?<option>.*) \((?<count>.*)\)$/;
const POLL_ID_SCHEMA = /id:\s(?<pollId>\d+)$/;

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
      fields,
      footer: footerObject,
      title,
    },
  };
};

const getPollEmbed = ({ options, pollId, prompt, votes = {} }) => {
  const votePairs = Object.entries(votes);
  const fields = votePairs
    .sort((pairA, pairB) => {
      const [categoryA] = pairA;
      const [categoryB] = pairB;
      return categoryA.localeCompare(categoryB);
    })
    .map(([category, listOfNames]) => {
      return {
        name: category,
        value: listOfNames.join("\n"),
      };
    });

  return getEmbed({
    fields,
    footer: `id: ${pollId}`,
    description: [...options.map(toPairText), POLL_DIVIDER].join("\n"),
    title: prompt,
  });
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

    const pairsWithCount = optionPairs.map((pairs) => [...pairs, 0]);
    const pollId = uniqueId();

    const pollEmbedMessage = await message.channel.send(
      getPollEmbed({ options: pairsWithCount, pollId, prompt: pollPrompt })
    );

    promiseQueue.addAll(
      optionPairs.map(([emoji]) => async () => {
        await pollEmbedMessage.react(emoji);
      })
    );

    database.storePoll({
      id: pollId,
      message: pollEmbedMessage,
      options: pairsWithCount,
      prompt: pollPrompt,
    });
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

const onChangeReaction = async (reaction, username, action) => {
  const message = reaction.message;
  const currentEmbed = message.embeds[0];

  if (username !== message.author.username) {
    const { pollId } =
      currentEmbed.footer.text.match(POLL_ID_SCHEMA).groups || {};

    const updateDatabase =
      action === "remove" ? database.removeVote : database.addVote;

    await updateDatabase({
      id: pollId,
      message,
      voteOption: reaction.emoji.name,
      username,
    });

    const updatedPoll = await database.getPoll(pollId, message);

    await message.edit(getPollEmbed(updatedPoll));
  }
};

module.exports = {
  onChangeReaction,
  onMessage,
};
