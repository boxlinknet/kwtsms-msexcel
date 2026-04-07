// src/services/phone-utils.ts
// Phone normalization, verification, deduplication, and coverage checking.
// Country rules sourced from kwtsms-js library (83 countries).
// Related: src/models/types.ts, test/phone-utils.test.ts

import { PhoneRule } from "../models/types";

// Arabic-Indic digits (U+0660-U+0669)
const ARABIC_DIGIT_MAP: Record<string, string> = {
  "\u0660": "0", "\u0661": "1", "\u0662": "2", "\u0663": "3", "\u0664": "4",
  "\u0665": "5", "\u0666": "6", "\u0667": "7", "\u0668": "8", "\u0669": "9",
};

// Devanagari digits (U+0966-U+096F)
const HINDI_DIGIT_MAP: Record<string, string> = {
  "\u0966": "0", "\u0967": "1", "\u0968": "2", "\u0969": "3", "\u096A": "4",
  "\u096B": "5", "\u096C": "6", "\u096D": "7", "\u096E": "8", "\u096F": "9",
};

export const COUNTRY_RULES: Record<string, PhoneRule> = {
  // GCC
  "965": { localLengths: [8], mobileStartDigits: ["4", "5", "6", "9"] },
  "966": { localLengths: [9], mobileStartDigits: ["5"] },
  "971": { localLengths: [9], mobileStartDigits: ["5"] },
  "973": { localLengths: [8], mobileStartDigits: ["3", "6"] },
  "974": { localLengths: [8], mobileStartDigits: ["3", "5", "6", "7"] },
  "968": { localLengths: [8], mobileStartDigits: ["7", "9"] },
  // Levant
  "962": { localLengths: [9], mobileStartDigits: ["7"] },
  "961": { localLengths: [7, 8], mobileStartDigits: ["3", "7", "8"] },
  "970": { localLengths: [9], mobileStartDigits: ["5"] },
  "964": { localLengths: [10], mobileStartDigits: ["7"] },
  "963": { localLengths: [9], mobileStartDigits: ["9"] },
  // Other Arab
  "967": { localLengths: [9], mobileStartDigits: ["7"] },
  "20":  { localLengths: [10], mobileStartDigits: ["1"] },
  "218": { localLengths: [9], mobileStartDigits: ["9"] },
  "216": { localLengths: [8], mobileStartDigits: ["2", "4", "5", "9"] },
  "212": { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "213": { localLengths: [9], mobileStartDigits: ["5", "6", "7"] },
  "249": { localLengths: [9], mobileStartDigits: ["9"] },
  // Non-Arab Middle East
  "98":  { localLengths: [10], mobileStartDigits: ["9"] },
  "90":  { localLengths: [10], mobileStartDigits: ["5"] },
  "972": { localLengths: [9], mobileStartDigits: ["5"] },
  // South Asia
  "91":  { localLengths: [10], mobileStartDigits: ["6", "7", "8", "9"] },
  "92":  { localLengths: [10], mobileStartDigits: ["3"] },
  "880": { localLengths: [10], mobileStartDigits: ["1"] },
  "94":  { localLengths: [9], mobileStartDigits: ["7"] },
  "960": { localLengths: [7], mobileStartDigits: ["7", "9"] },
  // East Asia
  "86":  { localLengths: [11], mobileStartDigits: ["1"] },
  "81":  { localLengths: [10], mobileStartDigits: ["7", "8", "9"] },
  "82":  { localLengths: [10], mobileStartDigits: ["1"] },
  "886": { localLengths: [9], mobileStartDigits: ["9"] },
  // Southeast Asia
  "65":  { localLengths: [8], mobileStartDigits: ["8", "9"] },
  "60":  { localLengths: [9, 10], mobileStartDigits: ["1"] },
  "62":  { localLengths: [9, 10, 11, 12], mobileStartDigits: ["8"] },
  "63":  { localLengths: [10], mobileStartDigits: ["9"] },
  "66":  { localLengths: [9], mobileStartDigits: ["6", "8", "9"] },
  "84":  { localLengths: [9], mobileStartDigits: ["3", "5", "7", "8", "9"] },
  "95":  { localLengths: [9], mobileStartDigits: ["9"] },
  "855": { localLengths: [8, 9], mobileStartDigits: ["1", "6", "7", "8", "9"] },
  "976": { localLengths: [8], mobileStartDigits: ["6", "8", "9"] },
  // Europe
  "44":  { localLengths: [10], mobileStartDigits: ["7"] },
  "33":  { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "49":  { localLengths: [10, 11], mobileStartDigits: ["1"] },
  "39":  { localLengths: [10], mobileStartDigits: ["3"] },
  "34":  { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "31":  { localLengths: [9], mobileStartDigits: ["6"] },
  "32":  { localLengths: [9] },
  "41":  { localLengths: [9], mobileStartDigits: ["7"] },
  "43":  { localLengths: [10], mobileStartDigits: ["6"] },
  "47":  { localLengths: [8], mobileStartDigits: ["4", "9"] },
  "48":  { localLengths: [9] },
  "30":  { localLengths: [10], mobileStartDigits: ["6"] },
  "420": { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "46":  { localLengths: [9], mobileStartDigits: ["7"] },
  "45":  { localLengths: [8] },
  "40":  { localLengths: [9], mobileStartDigits: ["7"] },
  "36":  { localLengths: [9] },
  "380": { localLengths: [9] },
  // Americas
  "1":   { localLengths: [10] },
  "52":  { localLengths: [10] },
  "55":  { localLengths: [11] },
  "57":  { localLengths: [10], mobileStartDigits: ["3"] },
  "54":  { localLengths: [10], mobileStartDigits: ["9"] },
  "56":  { localLengths: [9], mobileStartDigits: ["9"] },
  "58":  { localLengths: [10], mobileStartDigits: ["4"] },
  "51":  { localLengths: [9], mobileStartDigits: ["9"] },
  "593": { localLengths: [9], mobileStartDigits: ["9"] },
  "53":  { localLengths: [8], mobileStartDigits: ["5", "6"] },
  // Africa
  "27":  { localLengths: [9], mobileStartDigits: ["6", "7", "8"] },
  "234": { localLengths: [10], mobileStartDigits: ["7", "8", "9"] },
  "254": { localLengths: [9], mobileStartDigits: ["1", "7"] },
  "233": { localLengths: [9], mobileStartDigits: ["2", "5"] },
  "251": { localLengths: [9], mobileStartDigits: ["7", "9"] },
  "255": { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "256": { localLengths: [9], mobileStartDigits: ["7"] },
  "237": { localLengths: [9], mobileStartDigits: ["6"] },
  "225": { localLengths: [10] },
  "221": { localLengths: [9], mobileStartDigits: ["7"] },
  "252": { localLengths: [9], mobileStartDigits: ["6", "7"] },
  "250": { localLengths: [9], mobileStartDigits: ["7"] },
  // Oceania
  "61":  { localLengths: [9], mobileStartDigits: ["4"] },
  "64":  { localLengths: [8, 9, 10], mobileStartDigits: ["2"] },
};

// Sorted by prefix length descending so longer prefixes match first (e.g., "880" before "88")
const SORTED_PREFIXES = Object.keys(COUNTRY_RULES).sort((a, b) => b.length - a.length);

function convertNonLatinDigits(input: string): string {
  let result = "";
  for (const char of input) {
    result += ARABIC_DIGIT_MAP[char] || HINDI_DIGIT_MAP[char] || char;
  }
  return result;
}

export function findCountryPrefix(phone: string): string | null {
  for (const prefix of SORTED_PREFIXES) {
    if (phone.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

export function normalize(phone: string, defaultCountryCode: string): string {
  if (!phone) return "";

  let cleaned = convertNonLatinDigits(phone);
  cleaned = cleaned.replace(/\D/g, "");
  cleaned = cleaned.replace(/^0+/, "");

  if (!cleaned) return "";

  // Check if number already has a valid country prefix AND the total length
  // matches that country's expected format. Only then treat it as international.
  const prefix = findCountryPrefix(cleaned);
  if (prefix) {
    const rule = COUNTRY_RULES[prefix];
    const localPart = cleaned.substring(prefix.length);
    if (rule.localLengths.includes(localPart.length)) {
      // Valid international format, use as-is
      return cleaned;
    }
  }

  // Otherwise treat as local number: prepend default country code
  return defaultCountryCode + cleaned;
}

export interface VerifyResult {
  valid: boolean;
  warning: string | null;
}

export function verify(phone: string): VerifyResult {
  if (!phone || phone.length === 0) {
    return { valid: false, warning: null };
  }

  const prefix = findCountryPrefix(phone);

  if (!prefix) {
    if (phone.length >= 7 && phone.length <= 15) {
      return { valid: true, warning: "Unknown country prefix for number " + phone };
    }
    return { valid: false, warning: null };
  }

  const rule = COUNTRY_RULES[prefix];
  const localPart = phone.substring(prefix.length);

  if (!rule.localLengths.includes(localPart.length)) {
    return { valid: false, warning: null };
  }

  if (rule.mobileStartDigits && rule.mobileStartDigits.length > 0) {
    const firstLocalDigit = localPart[0];
    if (!rule.mobileStartDigits.includes(firstLocalDigit)) {
      return { valid: false, warning: null };
    }
  }

  return { valid: true, warning: null };
}

export interface DeduplicateResult {
  unique: string[];
  removed: string[];
}

export function deduplicate(phones: string[]): DeduplicateResult {
  const seen = new Set<string>();
  const unique: string[] = [];
  const removed: string[] = [];

  for (const phone of phones) {
    if (seen.has(phone)) {
      removed.push(phone);
    } else {
      seen.add(phone);
      unique.push(phone);
    }
  }

  return { unique, removed };
}

export function hasCountryCoverage(phone: string, coverageList: string[]): boolean {
  const prefix = findCountryPrefix(phone);
  if (!prefix) return false;
  return coverageList.includes(prefix);
}
