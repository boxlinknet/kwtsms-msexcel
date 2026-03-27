// src/services/settings.ts
// Wrapper for Office.context.document.settings (per-document, persists when saved).
// All writes call saveAsync() to persist to document.
// Related: src/models/types.ts

import { KwtSmsCredentials, CachedData } from "../models/types";

const KEYS = {
  USERNAME: "kwtsms_username",
  PASSWORD: "kwtsms_password",
  BALANCE: "kwtsms_balance",
  SENDER_IDS: "kwtsms_senderids",
  COVERAGE: "kwtsms_coverage",
  TEST_MODE: "kwtsms_testmode",
  DEFAULT_COUNTRY: "kwtsms_default_country",
  SELECTED_SENDER: "kwtsms_selected_sender",
};

function get(key: string): any {
  return Office.context.document.settings.get(key);
}

function set(key: string, value: any): void {
  Office.context.document.settings.set(key, value);
}

function remove(key: string): void {
  Office.context.document.settings.remove(key);
}

function saveAsync(): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error(result.error?.message || "Failed to save settings"));
      }
    });
  });
}

export async function saveCredentials(username: string, password: string): Promise<void> {
  set(KEYS.USERNAME, username);
  set(KEYS.PASSWORD, password);
  await saveAsync();
}

export function getCredentials(): KwtSmsCredentials | null {
  const username = get(KEYS.USERNAME);
  const password = get(KEYS.PASSWORD);
  if (!username || !password) return null;
  return { username, password };
}

export async function clearCredentials(): Promise<void> {
  remove(KEYS.USERNAME);
  remove(KEYS.PASSWORD);
  await saveAsync();
}

export async function saveCachedData(balance: number, senderIds: string[], coverage: string[]): Promise<void> {
  set(KEYS.BALANCE, balance);
  set(KEYS.SENDER_IDS, JSON.stringify(senderIds));
  set(KEYS.COVERAGE, JSON.stringify(coverage));
  await saveAsync();
}

export function getCachedData(): CachedData | null {
  const balance = get(KEYS.BALANCE);
  const senderIdsRaw = get(KEYS.SENDER_IDS);
  const coverageRaw = get(KEYS.COVERAGE);
  if (balance === null || balance === undefined) return null;
  return {
    balance: Number(balance),
    senderIds: senderIdsRaw ? JSON.parse(senderIdsRaw) : [],
    coverage: coverageRaw ? JSON.parse(coverageRaw) : [],
  };
}

export async function updateBalance(balance: number): Promise<void> {
  set(KEYS.BALANCE, balance);
  await saveAsync();
}

export async function clearCachedData(): Promise<void> {
  remove(KEYS.BALANCE);
  remove(KEYS.SENDER_IDS);
  remove(KEYS.COVERAGE);
  await saveAsync();
}

export async function setTestMode(enabled: boolean): Promise<void> {
  set(KEYS.TEST_MODE, enabled);
  await saveAsync();
}

export function getTestMode(): boolean {
  const val = get(KEYS.TEST_MODE);
  return val === null || val === undefined ? true : Boolean(val);
}

export async function setDefaultCountryCode(code: string): Promise<void> {
  set(KEYS.DEFAULT_COUNTRY, code);
  await saveAsync();
}

export function getDefaultCountryCode(): string {
  return get(KEYS.DEFAULT_COUNTRY) || "965";
}

export async function setSelectedSenderId(senderId: string): Promise<void> {
  set(KEYS.SELECTED_SENDER, senderId);
  await saveAsync();
}

export function getSelectedSenderId(): string {
  return get(KEYS.SELECTED_SENDER) || "KWT-SMS";
}
