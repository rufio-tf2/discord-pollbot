if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client } = require("discord.js");
const { handleAddVote, handleRemoveVote, onMessage } = require("./bot");
const {
  fetchPartialReaction,
  getNicknameFromReaction,
} = require("./bot/discordUtils");

const TOKEN = process.env.DISCORD_TOKEN;

// Partials for old messages -- https://discordjs.guide/popular-topics/reactions.html#listening-for-reactions-on-old-messages
const client = new Client({ partials: ["MESSAGE", "REACTION"] });

client.once("ready", () => {
  console.log("Bot ready");
});

client.on("message", (message) => {
  onMessage(message);
});

client.on("messageReactionAdd", async (reaction, user) => {
  await fetchPartialReaction(reaction);
  handleAddVote(reaction, user);
});

client.on("messageReactionRemove", async (reaction, user) => {
  await fetchPartialReaction(reaction);
  handleRemoveVote(reaction, user);
});

client.login(TOKEN);
