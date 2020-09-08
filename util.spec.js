const {
  endsWithPunctuation,
  includesPair,
  isArray,
  isArrayEmpty,
  isEmpty,
  isInRange,
  isNull,
  isObject,
  isObjectEmpty,
  isUndefined,
  oxfordJoin,
  parseArgs,
  randomFromBag,
  splitAt,
  splitFirstSpace,
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

describe("isInRange", () => {
  test.each([
    [[1, 0, 2], true],
    [[0, 0, 2], true],
    [[2, 0, 2], true],
    [[3, 0, 2], false],
    [[-1, 0, 2], false],
  ])("%s => %s", (args, expected) => {
    const actual = isInRange(...args);
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

describe("endsWithPunctuation", () => {
  test.each([
    ["Ends with punctuation.", true],
    ["Ends with punctuation?", true],
    ["Ends with punctuation!", true],
    ["Ends with punctuation", false],
  ])("%s => %s", (arg, expected) => {
    const actual = endsWithPunctuation(arg);
    expect(actual).toEqual(expected);
  });
});

describe("splitAt", () => {
  test.each([
    [
      [["apple", "orange", "plum"], -1],
      [["apple", "orange"], ["plum"]],
    ],
  ])("%s => %s", (args, expected) => {
    const actual = splitAt(...args);
    expect(actual).toEqual(expected);
  });
});

describe("randomFromBag", () => {
  test("pulls one", () => {
    const actual = randomFromBag([["Black", 1]]);
    const expected = ["Black", 0];
    expect(actual).toEqual(expected);
  });

  test("pulls one of", () => {
    const actual = randomFromBag([
      ["Black", 1],
      ["Blue", 1],
    ]);
    const expected = [
      ["Black", 0],
      ["Blue", 0],
    ];

    const matchFound = includesPair(expected, actual);

    expect(matchFound).toBe(true);
  });
});

describe("splitFirstSpace", () => {
  test.each([
    [`!slap abc def g`, ["!slap", "abc def g"]],
    //
  ])("%s => %s", (str, expected) => {
    const actual = splitFirstSpace(str);
    expect(actual).toEqual(expected);
  });
});

describe("oxfordJoin", () => {
  test.each([
    [["apple", "orange", "plum"], `apple, orange, and plum`],
    [["apple"], `apple`],
    [["apple", "orange"], `apple and orange`],
  ])("%s => %s", (arg, expected) => {
    const actual = oxfordJoin(arg);
    expect(actual).toEqual(expected);
  });
});

describe("parseArgs", () => {
  test("should preserve inner single quotes", () => {
    const args = `"Dave's kneecap"`;
    const actual = parseArgs(args);
    const expected = [`"Dave's kneecap"`];
  });

  test("should preserve inner double quotes", () => {
    const args = `'Whatever that "thing" was'`;
    const actual = parseArgs(args);
    const expected = [`'Whatever that "thing" was'`];
  });

  test.each([
    [
      `"This is a poll" "This is option A" 'Option B' OptionC`,
      ["This is a poll", "This is option A", "Option B", "OptionC"],
    ],
  ])("should split args", (arg, expected) => {
    const actual = parseArgs(arg);
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
