const { endsWithPunctuation, fs, markdown, underDash } = require("../util");
const { toEmbedObject } = require("./discordUtils");

const SLAP_PREFIXES = ["!slap"];

const loadSlapHelpMessage = () => {
  return fs.readFile("./helpMessages/SlapHelpMessage.md", "utf8");
};

const getSlapMessage = (target) => {
  const punctuation = endsWithPunctuation(target) ? "" : ".";
  return `SlapBot slaps ${target}${punctuation}`;
};

const handleSlap = async (message, target = "") => {
  const hasTarget = target.length > 0;

  if (hasTarget) {
    const slapMessage = getSlapMessage(target);
    message.channel.send(markdown.italicize(slapMessage));
  } else {
    const helpMessage = await loadSlapHelpMessage();

    message.channel.send(
      toEmbedObject({
        description: helpMessage,
        title: underDash(`Slap Command`),
      })
    );
  }
};

module.exports = { handleSlap, SLAP_PREFIXES };
