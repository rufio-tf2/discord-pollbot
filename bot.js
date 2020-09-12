const { MessageEmbed } = require("discord.js");
const { default: PQueue } = require("p-queue");

const fs = require("./fileSystem");
const { emojisByKey, getPollEmoji } = require("./getEmoji");
const database = require("./database");
const {
  areArraysEqual,
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
const POLL_ID_SCHEMA = /POLL_ID:\s(?<pollId>\d+)$/;

const promiseQueue = new PQueue({ concurrency: 1 });

const toDescriptionSummary = ({ emoji, option, count = 0 }) => {
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
  const sortedVotes = Object.values(votes).sort((voteA, voteB) => {
    return voteA.order - voteB.order;
  });

  const fields = sortedVotes
    .map(({ emoji, voters }) => {
      return voters.length
        ? {
            name: emoji,
            value: voters.sort().join("\n"),
          }
        : false;
    })
    .filter(Boolean);

  return getEmbed({
    fields,
    footer: `POLL_ID: ${pollId}`,
    description: [...options.map(toDescriptionSummary), POLL_DIVIDER].join(
      "\n"
    ),
    title: prompt,
  });
};

const buildOptions = (pollOptions) => {
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

  if (isYesNo) {
    const includeMaybe = pollOptions.some((option) =>
      ["maybe"].includes(option.toLowerCase())
    );

    const options = [
      {
        emoji: emojisByKey["yes"],
        option: "Yes",
        order: 0,
      },
      {
        emoji: emojisByKey["no"],
        option: "No",
        order: 1,
      },
    ];

    return includeMaybe
      ? [
          ...options,
          {
            emoji: emojisByKey["maybe"],
            option: "Maybe",
            order: 2,
          },
        ]
      : options;
  } else if (isTrueFalse) {
    return [
      {
        emoji: emojisByKey["yes"],
        option: "True",
        order: 0,
      },
      {
        emoji: emojisByKey["no"],
        option: "False",
        order: 1,
      },
    ];
  } else {
    return pollOptions.map((option, index) => {
      return { option, order: index, emoji: getPollEmoji(index + 1) };
    });
  }
};

const handlePoll = async (message, args) => {
  const hasArgs = args.length > 0;

  if (hasArgs) {
    const [pollPrompt, ...pollOptions] = args;

    const options = buildOptions(pollOptions);

    const pollId = uniqueId();

    const pollEmbed = getPollEmbed({
      options,
      pollId,
      prompt: pollPrompt,
    });

    const pollEmbedMessage = await message.channel.send(pollEmbed);

    promiseQueue.addAll(
      Object.values(
        options.map(({ emoji }) => async () => {
          await pollEmbedMessage.react(emoji);
        })
      )
    );

    database.storePoll({
      id: pollId,
      message: pollEmbedMessage,
      options,
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

    updateDatabase({
      id: pollId,
      message,
      voteEmoji: reaction.emoji.name,
      username,
    })
      .then(() => database.getPoll(pollId, message))
      .then((updatedPoll) => {
        message.edit(getPollEmbed(updatedPoll));
      });
  }
};

module.exports = {
  onChangeReaction,
  onMessage,
};
