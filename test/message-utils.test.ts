import { cleanMessage } from "../src/services/message-utils";

describe("cleanMessage", () => {
  it("returns plain text unchanged", () => {
    expect(cleanMessage("Hello world")).toBe("Hello world");
  });
  it("preserves Arabic text", () => {
    expect(cleanMessage("مرحبا بالعالم")).toBe("مرحبا بالعالم");
  });
  it("strips emojis", () => {
    expect(cleanMessage("Hello 😀 world 🌍")).toBe("Hello  world ");
  });
  it("strips HTML tags", () => {
    expect(cleanMessage("<b>Hello</b> <script>alert(1)</script>world")).toBe("Hello world");
  });
  it("strips zero-width spaces", () => {
    expect(cleanMessage("Hello\u200Bworld")).toBe("Helloworld");
  });
  it("strips BOM character", () => {
    expect(cleanMessage("\uFEFFHello")).toBe("Hello");
  });
  it("strips soft hyphens", () => {
    expect(cleanMessage("Hel\u00ADlo")).toBe("Hello");
  });
  it("strips zero-width joiners and non-joiners", () => {
    expect(cleanMessage("Hello\u200C\u200Dworld")).toBe("Helloworld");
  });
  it("converts Arabic-Indic digits to Latin", () => {
    expect(cleanMessage("\u0661\u0662\u0663")).toBe("123");
  });
  it("converts Devanagari digits to Latin", () => {
    expect(cleanMessage("\u0967\u0968\u0969")).toBe("123");
  });
  it("returns empty string for emoji-only message", () => {
    expect(cleanMessage("😀🌍🎉").trim()).toBe("");
  });
  it("returns empty string for empty input", () => {
    expect(cleanMessage("")).toBe("");
  });
  it("handles mixed Arabic text with emojis and HTML", () => {
    expect(cleanMessage("<p>مرحبا 😀</p>")).toBe("مرحبا ");
  });
});
