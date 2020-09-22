const isNumber = (v) => {
  return typeof v === "number";
};

const isString = (v) => {
  return typeof v === "string";
};

const isStringEmpty = (v) => {
  return isString(v) && v.length === 0;
};

const endsWithPunctuation = (str = "") => {
  const punctuation = [".", "!", "?"];
  return punctuation.some((punc) => str.endsWith(punc));
};

const parseArgs = (content) => {
  return content
    ? content
        .trim()
        .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
        .map(stripLeadingTrailingQuotes)
    : [];
};

const mapString = (str, fn) => {
  return str.split("").map(fn).join("");
};

const stripLeadingTrailingQuotes = (str) => {
  return str.replace(/^['"]|['"]$/g, "");
};

const underDash = (str) => {
  return `${str}\n${mapString(str, (char) => "-")}`;
};

const italicize = (str) => {
  return isStringEmpty(str) ? "" : `*${str}*`;
};

const bold = (str) => {
  return isStringEmpty(str) ? "" : `**${str}**`;
};

const splitFirstSpace = (str) => {
  const [partOne, partTwo] = str.split(/ (.*)/);
  return [partOne, partTwo];
};

const markdown = {
  bold,
  italicize,
};

module.exports = {
  endsWithPunctuation,
  isNumber,
  isString,
  isStringEmpty,
  mapString,
  markdown,
  parseArgs,
  splitFirstSpace,
  stripLeadingTrailingQuotes,
  underDash,
};
