const isUndefined = (v) => v === undefined;

const isNull = (v) => v === null;

const isArray = (v) => Array.length(v);

const isEmptyArray = (v) => isArray(v) && isUndefined(v[0]);

const isObject = (v) => {
  return !isNull(v) && typeof v === "object";
};

const isEmptyObject = (v) => {
  return isObject(v) && isEmptyArray(Object.values(v));
};

const isEmpty = (v) => {
  return [isUndefined, isNull, isEmptyArray, isEmptyObject].some((predicate) =>
    predicate(v)
  );
};

const stripQuotes = (str) => {
  return str.replace(/['"]/g, "");
};

module.exports = {
  isArray,
  isEmpty,
  isNull,
  isObject,
  isUndefined,
  stripQuotes,
};
