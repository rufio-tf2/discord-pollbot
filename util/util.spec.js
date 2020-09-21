const {
  endsWithPunctuation,
  parseArgs,
  splitFirstSpace,
  stripLeadingTrailingQuotes,
} = require("./util");

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

describe("splitFirstSpace", () => {
  test.each([
    [`!slap abc def g`, ["!slap", "abc def g"]],
    //
  ])("%s => %s", (str, expected) => {
    const actual = splitFirstSpace(str);
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
