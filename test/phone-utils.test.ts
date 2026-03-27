import { normalize, verify, deduplicate, hasCountryCoverage } from "../src/services/phone-utils";

describe("normalize", () => {
  it("strips non-digit characters", () => {
    expect(normalize("+965-9876-5432", "965")).toBe("96598765432");
  });
  it("strips leading zeros", () => {
    expect(normalize("0096598765432", "965")).toBe("96598765432");
  });
  it("converts Arabic digits to Latin", () => {
    expect(normalize("\u0669\u0666\u0665\u0669\u0668\u0667\u0666\u0665\u0664\u0663\u0662", "965")).toBe("96598765432");
  });
  it("converts Hindi digits to Latin", () => {
    expect(normalize("\u096F\u096C\u096B\u096F\u096E\u096D\u096C\u096B\u096A\u0969\u0968", "965")).toBe("96598765432");
  });
  it("prepends default country code when no prefix recognized", () => {
    expect(normalize("87654321", "965")).toBe("96587654321");
  });
  it("does not double-prepend country code", () => {
    expect(normalize("96598765432", "965")).toBe("96598765432");
  });
  it("handles spaces and dashes", () => {
    expect(normalize("965 9876 5432", "965")).toBe("96598765432");
  });
  it("handles empty string", () => {
    expect(normalize("", "965")).toBe("");
  });
});

describe("verify", () => {
  it("accepts valid Kuwait number (965 + 8 digits)", () => {
    expect(verify("96598765432")).toEqual({ valid: true, warning: null });
  });
  it("rejects Kuwait number with wrong length", () => {
    expect(verify("9659876543")).toEqual({ valid: false, warning: null });
  });
  it("accepts valid Saudi number (966 + 9 digits)", () => {
    expect(verify("966512345678")).toEqual({ valid: true, warning: null });
  });
  it("rejects Saudi number with wrong mobile start digit", () => {
    expect(verify("966112345678")).toEqual({ valid: false, warning: null });
  });
  it("accepts valid UK number (44 + 10 digits)", () => {
    expect(verify("447911123456")).toEqual({ valid: true, warning: null });
  });
  it("falls back with warning for unknown country prefix", () => {
    const result = verify("99912345678");
    expect(result.valid).toBe(true);
    expect(result.warning).toContain("Unknown country prefix");
  });
  it("rejects number shorter than 7 digits (unknown prefix fallback)", () => {
    expect(verify("12345")).toEqual({ valid: false, warning: null });
  });
  it("rejects number longer than 15 digits (unknown prefix fallback)", () => {
    expect(verify("1234567890123456")).toEqual({ valid: false, warning: null });
  });
  it("rejects empty string", () => {
    expect(verify("")).toEqual({ valid: false, warning: null });
  });
});

describe("deduplicate", () => {
  it("removes duplicate numbers", () => {
    expect(deduplicate(["96598765432", "96598765432", "966512345678"])).toEqual({
      unique: ["96598765432", "966512345678"],
      removed: ["96598765432"],
    });
  });
  it("returns empty arrays for empty input", () => {
    expect(deduplicate([])).toEqual({ unique: [], removed: [] });
  });
});

describe("hasCountryCoverage", () => {
  const coverage = ["965", "966", "971", "44"];
  it("returns true for covered country", () => {
    expect(hasCountryCoverage("96598765432", coverage)).toBe(true);
  });
  it("returns false for uncovered country", () => {
    expect(hasCountryCoverage("8613800138000", coverage)).toBe(false);
  });
});
