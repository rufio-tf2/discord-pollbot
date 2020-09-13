const dateFns = require("date-fns");
const { MessageEmbed } = require("discord.js");
const get = require("lodash.get");
const { default: PQueue } = require("p-queue");

const database = require("./database");
const {
  emojisByKey,
  endsWithPunctuation,
  fs,
  getPollEmoji,
  isNil,
  isString,
  markdown,
  parseArgs,
  splitFirstSpace,
  underDash,
  uniqueId,
} = require("./util");

const POLL_PREFIXES = ["!poll", "!p"];
const SLAP_PREFIXES = ["!slap"];
const UPDATE_POLL_PREFIXES = [
  "!updatepoll",
  "!up",
  "!syncpoll",
  "!votesync",
  "!vsync",
  "!psync",
];
const POLL_DIVIDER = "-----";
const FOOTER_JOINER = "  •  ";

const MAX_COLUMNS = 3; // 3 Max, 2 with Thumbnail (https://discordjs.guide/popular-topics/embeds.html#notes)

const OPTION_SCHEMA = /^(?<emoji>.*) - (?<option>.*) \((?<count>.*)\)$/;
const POLL_ID_SCHEMA = /POLL_ID:\s(?<pollId>\d+)/;

const formatTimeDistance = (time) => {
  const date = isString(time) ? new Date(time) : time;
  return dateFns.formatDistanceToNow(date, {
    includeSeconds: true,
  });
};

const promiseQueue = new PQueue({ concurrency: 1 });

const defaultPoll = {
  channelId: undefined,
  guildId: undefined,
  id: undefined,
  messageId: undefined,
  options: [],
  prompt: "",
  votes: {},
};

const toDescriptionSummary = ({ emoji, option, count = 0 }) => {
  return `${emoji} - ${option} (${count})`;
};

const loadPollHelpMessage = () => {
  return fs.readFile("./helpMessages/PollHelpMessage.md", "utf8");
};

const loadSlapHelpMessage = () => {
  return fs.readFile("./helpMessages/SlapHelpMessage.md", "utf8");
};

const getEmbed = ({ fields, footer, description = "", timestamp, title }) => {
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
      timestamp,
      title,
    },
  };
};

const buildLastActionText = ({ action, updatedAt, username }) => {
  if (["cast", "removed"].includes(action)) {
    return `Vote ${action} by ${username}!`;
  }

  if (action === "update") {
    return `Votes sync'd!`;
  }
};

const getPollEmbed = ({
  id,
  lastVoter,
  options,
  prompt,
  votes = {},
  updatedAt,
}) => {
  const sortedOptions = options
    .filter((option) => {
      const vote = get(votes, option.emoji, {});
      const { voters = [] } = vote;
      return voters.length > 0;
    })
    .sort((optionA, optionB) => {
      return optionA.order - optionB.order;
    });

  const fields = sortedOptions.map((option) => {
    const vote = votes[option.emoji];
    const { voters } = vote;

    return {
      inline: true,
      name: option.emoji,
      value: voters.sort().join("\n"),
    };
  });

  const fieldsWithBuffer =
    sortedOptions.length % MAX_COLUMNS === 0
      ? fields
      : [
          ...fields,
          {
            inline: true,
            name: "\u200b",
            value: "\u200b",
          },
        ];

  const pollIdLabeled = `POLL_ID: ${id}`;

  const lastVoterText = lastVoter
    ? buildLastActionText({ ...lastVoter, updatedAt })
    : undefined;

  const footer = [pollIdLabeled, lastVoterText]
    .filter(Boolean)
    .join(FOOTER_JOINER);

  const optionsWithCount = options.map((option) => ({
    ...option,
    count: votes[option.emoji] ? votes[option.emoji].count : 0,
  }));

  const description = [
    ...optionsWithCount.map(toDescriptionSummary),
    optionsWithCount.some(({ count }) => count > 0) ? POLL_DIVIDER : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return getEmbed({
    description,
    fields: fieldsWithBuffer,
    footer: [POLL_DIVIDER, footer].join("\n"),
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
    const [prompt, ...pollOptions] = args;

    const options = buildOptions(pollOptions);

    const pollId = uniqueId();

    const pollEmbed = getPollEmbed({
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

const getNicknameFromReaction = (reaction, userId) => {
  return reaction.message.guild.member(userId).displayName;
};

const getVoteCount = (poll, emoji) => {
  return get(poll, ["votes", emoji, "count"], 0);
};

const handleUpdatePoll = async (message, pollId) => {
  if (isNil(pollId) || isNaN(pollId)) return;

  const currentPoll = await database.getPoll(message, pollId);

  if (currentPoll.messageId) {
    let pollMessage;

    try {
      pollMessage = await message.channel.messages.fetch(currentPoll.messageId);
    } catch (error) {
      console.error("Error fetching poll message. Unable to update poll.");
    }

    if (pollMessage) {
      const getUpdatedVotesWithReactions = async () => {
        return pollMessage.reactions.cache.reduce((acc, reaction) => {
          const emojiReaction = reaction.emoji.name;

          const updatedVoters = reaction.users.cache
            .map((user) => {
              const username = getNicknameFromReaction(reaction, user.id);

              return username !== pollMessage.author.username
                ? username
                : false;
            })
            .filter(Boolean);

          return {
            ...acc,
            lastVoter: acc.lastVoter || {
              action: "update",
              username: getNicknameFromReaction(reaction, message.author.id),
            },
            [emojiReaction]: {
              count: updatedVoters.length,
              emoji: emojiReaction,
              voters: updatedVoters,
            },
          };
        }, {});
      };

      const updatedVotes = await getUpdatedVotesWithReactions();

      const updatedPoll = {
        ...currentPoll,
        lastVoter: updatedVotes.lastVoter,
        updatedAt: new Date().getTime(),
        votes: Object.fromEntries(
          Object.entries(updatedVotes).filter(([key]) => key !== "lastVoter")
        ),
      };

      const changes = Object.values(updatedPoll.votes).reduce(
        (acc, { count, emoji }) => {
          const currentVoteCount = getVoteCount(currentPoll, emoji);
          return currentVoteCount !== count
            ? [...acc, [emoji, count - currentVoteCount]]
            : acc;
        },
        []
      );

      const changesString = changes
        .map(([emoji, delta]) => `${emoji} (${delta >= 0 ? "+" : ""}${delta})`)
        .join(", ");

      const changesMessage =
        changes.length > 0
          ? `Votes updated for ${changesString}.`
          : `No changes since last update ${formatTimeDistance(
              currentPoll.updatedAt || currentPoll.createdAt
            )} ago.`;

      const updateMessage = [
        `✅ Poll sync'd.`,
        markdown.italicize(changesMessage),
      ].join("\n");

      database
        .setPoll(updatedPoll)
        .then(() => database.getPoll(message, pollId))
        .then((poll) => {
          pollMessage.edit(getPollEmbed(poll));
        })
        .then(() => {
          message.channel.send(updateMessage);
        });
    }
  }
};

const onMessage = (message) => {
  const [firstArg, restMessage] = splitFirstSpace(message.content);
  const normalizedFirstArg = firstArg.toLowerCase();

  const isPoll = POLL_PREFIXES.includes(normalizedFirstArg);
  const isSlap = SLAP_PREFIXES.includes(normalizedFirstArg);
  const isUpdatePoll = UPDATE_POLL_PREFIXES.includes(normalizedFirstArg);

  if (isPoll) {
    const args = parseArgs(restMessage);
    handlePoll(message, args);
  } else if (isUpdatePoll) {
    const targetPollId = parseInt(restMessage);
    handleUpdatePoll(message, targetPollId);
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

    const handleVote =
      action === "remove" ? database.removeVote : database.addVote;

    handleVote({
      id: pollId,
      message,
      reaction,
      username,
    })
      .then(() => database.getPoll(message, pollId))
      .then((updatedPoll) => {
        message.edit(getPollEmbed(updatedPoll));
      });
  }
};

module.exports = {
  onChangeReaction,
  onMessage,
};
