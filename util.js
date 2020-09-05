const isBoolean = (v) => {
  return typeof v === "boolean";
  s;
};

const isUndefined = (v) => v === undefined;

const isNull = (v) => v === null;

const isArray = (v) => Array.isArray(v);

const isArrayEmpty = (v) => {
  return isArray(v) ? v.length === 0 : undefined;
};

const isObject = (v) => {
  return !isNull(v) && typeof v === "object";
};

const isObjectEmpty = (v) => {
  return isObject(v) ? isArrayEmpty(Object.values(v)) : undefined;
};

const isEmpty = (v) => {
  return [
    Boolean,
    isUndefined,
    isNull,
    isArrayEmpty,
    isObjectEmpty,
  ].some((predicate) => predicate(v));
};

const stripLeadingTrailingQuotes = (str) => {
  return str.replace(/^['"]|['"]$/g, "");
};

module.exports = {
  isArray,
  isArrayEmpty,
  isEmpty,
  isNull,
  isObject,
  isObjectEmpty,
  isUndefined,
  stripLeadingTrailingQuotes,
};
