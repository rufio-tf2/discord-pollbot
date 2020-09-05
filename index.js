if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client } = require("discord.js");

const { delegateTask } = require("./bot");

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client();

client.once("ready", () => {
  console.log("Bot ready");
});

client.on("message", (message) => {
  delegateTask(message);
});

client.login(TOKEN);
