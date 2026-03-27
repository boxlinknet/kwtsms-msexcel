// src/services/message-utils.ts
// Message cleaning: strip emojis, hidden Unicode, HTML tags, convert non-Latin digits.
// Preserves Arabic text content. Returns empty string if nothing remains.
// Related: test/message-utils.test.ts

const ARABIC_DIGIT_MAP: Record<string, string> = {
  "\u0660": "0", "\u0661": "1", "\u0662": "2", "\u0663": "3", "\u0664": "4",
  "\u0665": "5", "\u0666": "6", "\u0667": "7", "\u0668": "8", "\u0669": "9",
};

const HINDI_DIGIT_MAP: Record<string, string> = {
  "\u0966": "0", "\u0967": "1", "\u0968": "2", "\u0969": "3", "\u096A": "4",
  "\u096B": "5", "\u096C": "6", "\u096D": "7", "\u096E": "8", "\u096F": "9",
};

// Emoji regex using surrogate pairs (es5-compatible, no /u flag).
// Covers emoticons, misc symbols, transport, flags, supplemental symbols, etc.
const EMOJI_REGEX = /(?:\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF\uDE00-\uDE6F\uDE70-\uDEFF]|\uD83C[\uDDE0-\uDDFF]|[\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F]|\uD83C\uDFFB|\uD83C\uDFFC|\uD83C\uDFFD|\uD83C\uDFFE|\uD83C\uDFFF|\u20E3)/g;

const HIDDEN_CHARS_REGEX = /[\uFEFF\u200B\u200C\u200D\u00AD\u2060\u2061\u2062\u2063\u2064\u180E\uFFF9\uFFFA\uFFFB]/g;

// Strip script/style blocks (tag + inner content) before stripping remaining tags.
const SCRIPT_STYLE_REGEX = /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

function convertNonLatinDigits(input: string): string {
  let result = "";
  for (const char of input) {
    result += ARABIC_DIGIT_MAP[char] || HINDI_DIGIT_MAP[char] || char;
  }
  return result;
}

export function cleanMessage(text: string): string {
  if (!text) return "";

  let cleaned = text;
  cleaned = cleaned.replace(SCRIPT_STYLE_REGEX, "");
  cleaned = cleaned.replace(HTML_TAG_REGEX, "");
  cleaned = cleaned.replace(EMOJI_REGEX, "");
  cleaned = cleaned.replace(HIDDEN_CHARS_REGEX, "");
  cleaned = convertNonLatinDigits(cleaned);

  return cleaned;
}
