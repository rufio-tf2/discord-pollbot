if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client } = require("discord.js");
const { onChangeReaction, onMessage } = require("./bot");
const { getNicknameFromReaction } = require("./bot/discordUtils");

const fetchPartialReaction = async (reaction) => {
  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
    } catch {
      console.error("Failed to fetch cached message ", reaction.message.id);
    }
  }

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      console.error("Failed to fetch cached reaction.");
    }
  }
};

const getReactionHandler = (action) => async (reaction, user) => {
  await fetchPartialReaction(reaction);
  const username = getNicknameFromReaction(reaction, user.id);
  onChangeReaction(reaction, username, action);
};

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ partials: ["REACTION"] });

client.once("ready", () => {
  console.log("Bot ready");
});

client.on("message", (message) => {
  onMessage(message);
});

client.on("messageReactionAdd", getReactionHandler("add"));

client.on("messageReactionRemove", getReactionHandler("remove"));

client.login(TOKEN);
