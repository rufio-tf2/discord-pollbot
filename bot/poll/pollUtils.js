const get = require("lodash.get");

const { getEmbed } = require("../discordUtils");
const { formatDateShort, emojisByKey, getPollEmoji } = require("../../util");
const { MAX_EMBED_COLUMNS } = require("../discordUtils");

const POLL_DIVIDER = "-----";
const FOOTER_JOINER = "  •  ";

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
            name: "\u200b",
            value: "\u200b",
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

module.exports = {
  buildOptions,
  pollToEmbed,
  getVoteCount,
};
