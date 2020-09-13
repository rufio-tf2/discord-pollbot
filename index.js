if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client } = require("discord.js");

const { onChangeReaction, onMessage } = require("./bot");

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client();

client.once("ready", () => {
  console.log("Bot ready");
});

client.on("message", (message) => {
  onMessage(message);
});

const getNickname = async (reaction, user) => {
  return reaction.message.guild.member(user.id).displayName;
};

client.on("messageReactionAdd", async (reaction, user) => {
  const username = await getNickname(reaction, user);
  onChangeReaction(reaction, username, "add");
});

client.on("messageReactionRemove", async (reaction, user) => {
  const username = await getNickname(reaction, user);
  onChangeReaction(reaction, username, "remove");
});

client.login(TOKEN);
