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

client.on("messageReactionAdd", (reaction, user) => {
  onChangeReaction(reaction, user);
});

client.on("messageReactionRemove", (reaction, user) => {
  onChangeReaction(reaction, user);
});

client.login(TOKEN);
