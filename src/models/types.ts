// src/models/types.ts
// kwtSMS for Excel - shared TypeScript interfaces
// Related: services/kwtsms-api.ts, services/logger.ts, services/settings.ts

export interface KwtSmsCredentials {
  username: string;
  password: string;
}

export interface BalanceResponse {
  result: string;
  available: number;
  purchased: number;
}

export interface SenderIdResponse {
  result: string;
  senderid: string[];
}

export interface CoverageResponse {
  result: string;
  coverage: string[];
}

export interface SendResponse {
  result: string;
  "msg-id": string;
  numbers: number;
  "points-charged": number;
  "balance-after": number;
  "unix-timestamp": number;
}

export interface ValidateResponse {
  result: string;
  mobile: {
    OK: string[];
    ER: string[];
    NR: string[];
  };
}

export interface ApiErrorResponse {
  result: "ERROR";
  code: string;
  description: string;
}

export interface PhoneRule {
  localLengths: number[];
  mobileStartDigits?: string[];
}

export interface PhoneValidationResult {
  valid: string[];
  invalid: string[];
  noCoverage: string[];
  duplicates: string[];
}

export type SendStatus = "SENT" | "FAILED" | "SKIPPED_NO_COVERAGE" | "SKIPPED_DUPLICATE";

export interface LogEntry {
  timestamp: string;
  phone: string;
  message: string;
  senderId: string;
  status: SendStatus;
  errorDescription: string;
  msgId: string;
  pointsCharged: number;
}

export interface CachedData {
  balance: number;
  senderIds: string[];
  coverage: string[];
}

export interface AppSettings {
  credentials: KwtSmsCredentials | null;
  cachedData: CachedData | null;
  testMode: boolean;
  defaultCountryCode: string;
  selectedSenderId: string;
}
