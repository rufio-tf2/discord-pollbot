const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

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

const endsWithPunctuation = (str = "") => {
  const punctuation = [".", "!", "?"];
  return punctuation.some((punc) => str.endsWith(punc));
};

const secondsToMilliseconds = (seconds) => {
  return seconds * 1000;
};

const minutesToMilliseconds = (minutes) => {
  return secondsToMilliseconds(minutes * 60);
};

// ---

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

const oxfordJoin = (arr) => {
  if (arr.length < 2) {
    return arr[0];
  } else if (arr.length === 2) {
    return arr.join(" and ");
  }

  const [parts, lastPart] = splitAt(arr, -1);
  return lastPart ? `${parts.join(", ")}, and ${lastPart[0]}` : parts[0];
};

const splitFirstSpace = (str) => {
  const [partOne, partTwo] = str.split(/ (.*)/);
  return [partOne, partTwo];
};

const markdown = {
  bold,
  italicize,
};

const includesPair = (arr, [key, value]) => {
  return !!arr.find(([k, v]) => {
    return k === key && v === value;
  });
};

const isInRange = (number, minInclusive, maxInclusive) => {
  return number >= minInclusive && number <= maxInclusive;
};

const randomFromBag = (pairs) => {
  if (pairs.length === 0) return;

  const total = pairs.reduce((sum, [, value]) => {
    return sum + value;
  }, 0);

  const map = pairs.reduce((acc, [key, count]) => {
    const max = Math.round(count / total) * 100;
    return [...acc, { count, key, max }];
  }, []);

  const randomIndex = getRandomInt(100);

  for (let i = 0; i < map.length; i += 1) {
    const { count, key, max } = map[i];

    if (randomIndex < max) {
      return [key, count - 1];
    }
  }
};

let uid = 0;
const uniqueId = (prefix) => {
  const result = prefix ? `${prefix}-${uid}` : uid;
  uid += 1;
  return result;
};

module.exports = {
  endsWithPunctuation,
  includesPair,
  isArray,
  isArrayEmpty,
  isBoolean,
  isEmpty,
  isInRange,
  isNull,
  isObject,
  isObjectEmpty,
  isString,
  isStringEmpty,
  isUndefined,
  mapString,
  markdown,
  minutesToMilliseconds,
  oxfordJoin,
  parseArgs,
  randomFromBag,
  secondsToMilliseconds,
  splitAt,
  splitFirstSpace,
  stripLeadingTrailingQuotes,
  underDash,
  uniqueId,
};
