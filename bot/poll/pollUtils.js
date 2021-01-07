const get = require("lodash.get");

const { getEmbed } = require("../discordUtils");
const {
  emojisByKey,
  formatDateShort,
  getPollEmoji,
  isNumber,
  isString,
} = require("../../util");
const {
  getNicknameFromReaction,
  isMe,
  MAX_EMBED_COLUMNS,
} = require("../discordUtils");

const POLL_DIVIDER = "-----";
const FOOTER_JOINER = "  •  ";
const BLANK_CHAR = "\u200b";

const OPTION_SCHEMA = /^(?<emoji>.*) - (?<option>.*) \((?<count>.*)\)$/;

const isOptionString = (optionString) => {
  const { count, emoji, option } =
    optionString.match(OPTION_SCHEMA).groups || {};
  return isString(emoji) && isString(option) && isNumber(parseInt(count, 10));
};

const isPollMessage = (message) => {
  const hasEmbed = !!message.embeds.length > 0;

  if (hasEmbed) {
    const embed = message.embeds[0];

    const potentialOptions = embed.description.split("\n");
    const hasTwoPotentialOptions = potentialOptions.length >= 2;
    const [optionA, optionB] = potentialOptions;

    return hasTwoPotentialOptions && [optionA, optionB].every(isOptionString);
  }

  return false;
};

const isReactionToPoll = (reaction) => {
  return isMe(reaction.message.author.id) && isPollMessage(reaction.message);
};

const parseOptionString = (optionString) => {
  const match = optionString.match(OPTION_SCHEMA);
  const { count, emoji, option } = match ? match.groups : {};

  return { count, emoji, option };
};

const buildOptionsFromEmbed = (embed) => {
  const options = embed.description
    .split("\n")
    .map(parseOptionString)
    .filter(({ option = "" }) => option.length > 0);

  return options;
};

const buildVotesFromMessage = async (message) => {
  return await message.reactions.cache.reduce(async (accumulator, reaction) => {
    const emojiReaction = reaction.emoji.name;

    try {
      await reaction.users.fetch();
    } catch {
      console.error(
        "[buildVotesFromMessage] Error fetching users for reaction",
        reaction.emoji.name
      );
      return accumulator;
    }

    const voters = reaction.users.cache
      .map((user) => {
        const username = getNicknameFromReaction(reaction, user.id);
        return isMe(user.id) ? false : username;
      })
      .filter(Boolean);

    return voters.length > 0
      ? {
          ...(await accumulator),
          [emojiReaction]: {
            count: voters.length,
            emoji: emojiReaction,
            voters,
          },
        }
      : accumulator;
  }, {});
};

const buildPollFromMessage = async (message) => {
  const hasEmbed = !!message.embeds.length > 0;

  if (hasEmbed) {
    const embed = message.embeds[0];

    return {
      channelId: message.channel.id,
      createdAt: message.createdTimestamp,
      guildId: message.channel.guild.id,
      messageId: message.id,
      options: buildOptionsFromEmbed(embed).map(({ emoji, option }, index) => {
        return {
          emoji,
          option,
          order: index,
        };
      }),
      prompt: embed.title,
      votes: await buildVotesFromMessage(message),
      updatedAt:
        message.editedTimestamp > 0 ? message.editedTimestamp : undefined,
    };
  }

  return;
};

const alphabeticallyAscending = (stringA, stringB) => {
  return stringA.toLowerCase().localeCompare(stringB.toLowerCase());
};

const getVoteCount = (poll, emoji) => {
  return get(poll, ["votes", emoji, "count"], 0);
};

const toDescriptionSummary = ({ emoji, option, count = 0 }) => {
  return `${emoji} - ${option} (${count})`;
};

const buildLastActionText = ({ username }) => {
  return `Last vote by ${username}`;
};

const pollToEmbed = (poll) => {
  const { createdAt, lastVoter, options, prompt, votes = {}, updatedAt } = poll;

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
      value: voters.sort(alphabeticallyAscending).join("\n"),
    };
  });

  const fieldsWithBuffer =
    sortedOptions.length % MAX_EMBED_COLUMNS === 0
      ? fields
      : [
          ...fields,
          {
            inline: true,
            name: BLANK_CHAR,
            value: BLANK_CHAR,
          },
        ];

  const lastVoterText = lastVoter ? buildLastActionText(lastVoter) : undefined;

  const footer = [lastVoterText, formatDateShort(updatedAt || createdAt)]
    .filter(Boolean)
    .join(FOOTER_JOINER);

  const optionsWithCount = options.map((option) => ({
    ...option,
    count: getVoteCount(poll, option.emoji),
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
    pollOptions.every((option) =>
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

module.exports = {
  buildOptions,
  buildPollFromMessage,
  getVoteCount,
  isReactionToPoll,
  pollToEmbed,
};
