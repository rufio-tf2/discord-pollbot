const {
  isArray,
  isArrayEmpty,
  isEmpty,
  isNull,
  isObject,
  isObjectEmpty,
  isUndefined,
  stripLeadingTrailingQuotes,
} = require("./util");

describe("isArray", () => {
  test.each([
    [[], true],
    [{}, false],
    ["words", false],
    [1234, false],
    [true, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isArray(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isArrayEmpty", () => {
  test.each([
    [[], true],
    [[1, 2, 3], false],
    [{}, undefined],
    ["words", undefined],
    [1234, undefined],
    [true, undefined],
  ])("%s => %s", (arg, expected) => {
    const actual = isArrayEmpty(arg);

    expect(actual).toEqual(expected);
  });
});
