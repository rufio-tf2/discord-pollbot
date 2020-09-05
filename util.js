const isBoolean = (v) => {
  return typeof v === "boolean";
};

const isUndefined = (v) => v === undefined;

const isNull = (v) => v === null;

const isArray = (v) => Array.isArray(v);

const isArrayEmpty = (v) => {
  return isArray(v) && v.length === 0;
};

const isObject = (v) => {
  return !isNull(v) && !isArray(v) && typeof v === "object";
};

const isObjectEmpty = (v) => {
  return isObject(v) && isArrayEmpty(Object.values(v));
};

const isNumber = (v) => {
  return typeof v === "number";
};

const isString = (v) => {
  return typeof v === "string";
};

const isStringEmpty = (v) => {
  return isString(v) && v.length === 0;
};

const isEmpty = (v) => {
  return [
    isBoolean,
    isNumber,
    isStringEmpty,
    isUndefined,
    isNull,
    isArrayEmpty,
    isObjectEmpty,
  ].some((predicate) => predicate(v));
};

const splitAt = (arr, index) => {
  return [arr.slice(0, index), arr.slice(index)];
};

// ---

const parseMessageContents = (content) => {
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

const oxfordJoin = (arr) => {
  if (arr.length < 2) {
    return arr[0];
  } else if (arr.length === 2) {
    return arr.join(" and ");
  }

  const [parts, lastPart] = splitAt(arr, -1);
  return lastPart ? `${parts.join(", ")}, and ${lastPart[0]}` : parts[0];
};

const markdown = {
  bold,
  italicize,
};

module.exports = {
  isArray,
  isArrayEmpty,
  isBoolean,
  isEmpty,
  isNull,
  isObject,
  isObjectEmpty,
  isString,
  isStringEmpty,
  isUndefined,
  mapString,
  markdown,
  oxfordJoin,
  parseMessageContents,
  splitAt,
  stripLeadingTrailingQuotes,
  underDash,
};
