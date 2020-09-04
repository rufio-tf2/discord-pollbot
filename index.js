if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client, MessageEmbed } = require("discord.js");

const { isUndefined, stripLeadingTrailingQuotes } = require("./util");
const getCountEmoji = require("./getCountEmoji");

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = "!p";

const getEmbed = ({ message = "", title }) => {
  return {
    color: 0xcf5a00,
    description: message,
    title,
  };
};

const bot = new Client();

bot.once("ready", () => {
  console.log("Bot ready");
});

bot.on("message", async (message) => {
  const [firstArg, ...args] = message.content
    ? message.content
        .trim()
        .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
        .map(stripLeadingTrailingQuotes)
    : [];

  const isUsingBot = firstArg === PREFIX;

  if (isUsingBot) {
    const [pollPrompt, ...pollOptions] = args;
    const hasArgs = !isUndefined(pollPrompt);

    if (hasArgs) {
      const isYesNo =
        pollOptions.length <= 2 &&
        pollOptions.some((option) =>
          ["yes", "no"].includes(option.toLowerCase())
        );

      const isTrueFalse =
        pollOptions.length <= 2 &&
        pollOptions.some((option) =>
          ["true", "false"].includes(option.toLowerCase())
        );

      let optionPairs;
      let embedText;

      if (isYesNo) {
        optionPairs = [
          ["👍", "Yes"],
          ["👎", "No"],
        ];
      } else if (isTrueFalse) {
        optionPairs = [
          ["✅", "True"],
          ["❌", "False"],
        ];
      } else {
        optionPairs = pollOptions.map((option, index) => [
          getCountEmoji(index + 1),
          option,
        ]);

        embedText = optionPairs
          .map(([emoji, option]) => `${emoji} - ${option}`)
          .join("\n");
      }

      const embed = getEmbed({
        message: embedText,
        title: pollPrompt,
      });

      const embedMessage = await message.channel.send({ embed });

      try {
        optionPairs.forEach(async ([emoji], index) => {
          await embedMessage.react(emoji);
        });
      } catch (error) {
        console.error("An emoji failed to react.");
      }
    }
  }
});

bot.login(TOKEN);
