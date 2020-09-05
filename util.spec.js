const {
  isArray,
  isArrayEmpty,
  isEmpty,
  isNull,
  isObject,
  isObjectEmpty,
  isUndefined,
  oxfordJoin,
  splitAt,
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
    [{}, false],
    ["words", false],
    [1234, false],
    [true, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isArrayEmpty(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isEmpty", () => {
  test.each([
    [null, true],
    [[], true],
    [{}, true],
    [{}, true],
    ["", true],
    [1234, true],
    [true, true],
    [[1, 2, 3], false],
    [{ a: 1 }, false],
    ["words", false],
  ])("%s => %s", (arg, expected) => {
    const actual = isEmpty(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isNull", () => {
  test.each([
    [null, true],
    [[1, 2, 3], false],
    [{}, false],
    ["words", false],
    [1234, false],
    [true, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isNull(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isObject", () => {
  test.each([
    [{}, true],
    [{ a: 1 }, true],
    [[1, 2, 3], false],
    ["words", false],
    [1234, false],
    [true, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isObject(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isObjectEmpty", () => {
  test.each([
    [{}, true],
    [{ a: 1 }, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isObjectEmpty(arg);

    expect(actual).toEqual(expected);
  });
});

describe("isUndefined", () => {
  test.each([
    [undefined, true],
    [null, false],
    [[1, 2, 3], false],
    ["words", false],
    [1234, false],
    [true, false],
  ])("%s => %s", (arg, expected) => {
    const actual = isUndefined(arg);

    expect(actual).toEqual(expected);
  });
});

describe("splitAt", () => {
  test.each([
    [
      [["apple", "orange", "plum"], -1],
      [["apple", "orange"], ["plum"]],
    ],
    // save
  ])("%s => %s", (args, expected) => {
    const actual = splitAt(...args);

    expect(actual).toEqual(expected);
  });
});

describe("oxfordJoin", () => {
  test.each([
    [["apple", "orange", "plum"], `apple, orange, and plum`],
    [["apple"], `apple`],
  ])("%s => %s", (arg, expected) => {
    const actual = oxfordJoin(arg);

    expect(actual).toEqual(expected);
  });
});

describe("stripLeadingTrailingQuotes", () => {
  test.each([
    [`"double quotes"`, `double quotes`],
    [`'single quotes'`, `single quotes`],
    [`"leaves inner 'quotes'"`, `leaves inner 'quotes'`],
  ])("%s => %s", (arg, expected) => {
    const actual = stripLeadingTrailingQuotes(arg);

    expect(actual).toEqual(expected);
  });
});
