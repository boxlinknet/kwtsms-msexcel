// src/taskpane/taskpane.ts
// Task pane UI controller for kwtSMS Excel Add-in.
// Handles login/logout, column population, send preview, and the full send flow.
// Related: taskpane.html, services/*, models/types.ts, localization/strings.ts

/* global document, Excel, Office, console, setTimeout */

import * as api from "../services/kwtsms-api";
import * as settings from "../services/settings";
import { normalize, verify, deduplicate, hasCountryCoverage } from "../services/phone-utils";
import { cleanMessage } from "../services/message-utils";
import { ensureLogSheet, logBatch } from "../services/logger";
import { getString, formatString } from "../localization/strings";
import { LogEntry, SendStatus, SendResponse } from "../models/types";

const APP_VERSION = "1.0.7";
const BATCH_SIZE = 200;
const BATCH_DELAY_MS = 200;

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

let loginSection: HTMLElement;
let mainSection: HTMLElement;

// Login
let usernameInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let loginBtn: HTMLButtonElement;
let loginError: HTMLElement;

// Main
let balanceValue: HTMLElement;
let logoutBtn: HTMLButtonElement;
let senderIdSelect: HTMLSelectElement;
let testModeToggle: HTMLInputElement;
let phoneColumnSelect: HTMLSelectElement;
let messageColumnSelect: HTMLSelectElement;
let countryCodeSelect: HTMLSelectElement;
let refreshColumnsBtn: HTMLButtonElement;
let messageTemplate: HTMLTextAreaElement;
let sendPreview: HTMLElement;
let previewValid: HTMLElement;
let previewDuplicates: HTMLElement;
let previewSkipped: HTMLElement;
let sendBtn: HTMLButtonElement;
let sendResult: HTMLElement;
let sendError: HTMLElement;
let versionDisplay: HTMLElement;

// ---------------------------------------------------------------------------
// Office.onReady
// ---------------------------------------------------------------------------

Office.onReady((info) => {
  if (info.host !== Office.HostType.Excel) return;

  // Bind DOM references
  loginSection = document.getElementById("login-section") as HTMLElement;
  mainSection = document.getElementById("main-section") as HTMLElement;

  usernameInput = document.getElementById("username") as HTMLInputElement;
  passwordInput = document.getElementById("password") as HTMLInputElement;
  loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
  loginError = document.getElementById("login-error") as HTMLElement;

  balanceValue = document.getElementById("balance-value") as HTMLElement;
  logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
  senderIdSelect = document.getElementById("sender-id-select") as HTMLSelectElement;
  testModeToggle = document.getElementById("test-mode-toggle") as HTMLInputElement;
  phoneColumnSelect = document.getElementById("phone-column") as HTMLSelectElement;
  messageColumnSelect = document.getElementById("message-column") as HTMLSelectElement;
  countryCodeSelect = document.getElementById("country-code") as HTMLSelectElement;
  refreshColumnsBtn = document.getElementById("refresh-columns-btn") as HTMLButtonElement;
  messageTemplate = document.getElementById("message-template") as HTMLTextAreaElement;
  sendPreview = document.getElementById("send-preview") as HTMLElement;
  previewValid = document.getElementById("preview-valid") as HTMLElement;
  previewDuplicates = document.getElementById("preview-duplicates") as HTMLElement;
  previewSkipped = document.getElementById("preview-skipped") as HTMLElement;
  sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
  sendResult = document.getElementById("send-result") as HTMLElement;
  sendError = document.getElementById("send-error") as HTMLElement;
  versionDisplay = document.getElementById("version-display") as HTMLElement;

  // Bind events
  const loginForm = document.getElementById("login-form") as HTMLFormElement;
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });
  logoutBtn.addEventListener("click", handleLogout);
  refreshColumnsBtn.addEventListener("click", () => populateColumnDropdowns());
  phoneColumnSelect.addEventListener("change", handlePreviewUpdate);
  messageColumnSelect.addEventListener("change", handlePreviewUpdate);
  countryCodeSelect.addEventListener("change", handlePreviewUpdate);
  messageTemplate.addEventListener("input", handlePreviewUpdate);
  sendBtn.addEventListener("click", handleSend);

  senderIdSelect.addEventListener("change", () => {
    settings.setSelectedSenderId(senderIdSelect.value);
  });

  testModeToggle.addEventListener("change", () => {
    settings.setTestMode(testModeToggle.checked);
  });

  countryCodeSelect.addEventListener("change", () => {
    settings.setDefaultCountryCode(countryCodeSelect.value);
  });

  // Set version
  versionDisplay.textContent = formatString(getString("version"), { version: APP_VERSION });

  // Check for saved credentials to restore session
  const creds = settings.getCredentials();
  if (creds) {
    const cached = settings.getCachedData();
    if (cached) {
      populateSenderIds(cached.senderIds);
      populateCountryCodes(cached.coverage);
      updateBalanceDisplay(cached.balance);
      restoreSettingsToUI();
      showMainSection();
      populateColumnDropdowns();
    } else {
      // Credentials exist but no cached data: re-authenticate in background
      silentReAuth(creds.username, creds.password);
    }
  }
});

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function showMainSection(): void {
  loginSection.style.display = "none";
  mainSection.style.display = "";
}

function showLoginSection(): void {
  mainSection.style.display = "none";
  loginSection.style.display = "";
  usernameInput.value = "";
  passwordInput.value = "";
  loginError.style.display = "none";
  loginError.textContent = "";
}

async function silentReAuth(username: string, password: string): Promise<void> {
  try {
    const [balanceResp, senderIds, coverage] = await Promise.all([
      api.login(username, password),
      api.fetchSenderIds(username, password),
      api.fetchCoverage(username, password),
    ]);
    await settings.saveCachedData(balanceResp.available, senderIds, coverage);
    populateSenderIds(senderIds);
    populateCountryCodes(coverage);
    updateBalanceDisplay(balanceResp.available);
    restoreSettingsToUI();
    showMainSection();
    populateColumnDropdowns();
  } catch (e) {
    // Silent failure: stay on login screen
    console.error("Silent re-auth failed:", e);
  }
}

function restoreSettingsToUI(): void {
  const testMode = settings.getTestMode();
  testModeToggle.checked = testMode;

  const countryCode = settings.getDefaultCountryCode();
  countryCodeSelect.value = countryCode;

  const selectedSender = settings.getSelectedSenderId();
  if (selectedSender) {
    senderIdSelect.value = selectedSender;
  }
}

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

async function handleLogin(): Promise<void> {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  loginError.style.display = "none";
  loginError.textContent = "";

  if (!username || !password) {
    loginError.textContent = getString("loginError");
    loginError.style.display = "";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = getString("loggingIn");

  try {
    const [balanceResp, senderIds, coverage] = await Promise.all([
      api.login(username, password),
      api.fetchSenderIds(username, password),
      api.fetchCoverage(username, password),
    ]);

    await settings.saveCredentials(username, password);
    await settings.saveCachedData(balanceResp.available, senderIds, coverage);

    populateSenderIds(senderIds);
    populateCountryCodes(coverage);
    updateBalanceDisplay(balanceResp.available);
    restoreSettingsToUI();
    showMainSection();
    populateColumnDropdowns();
  } catch (err: any) {
    loginError.textContent = err.message || getString("loginError");
    loginError.style.display = "";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = getString("loginButton");
  }
}

// ---------------------------------------------------------------------------
// Logout flow
// ---------------------------------------------------------------------------

async function handleLogout(): Promise<void> {
  try {
    await settings.clearCredentials();
    await settings.clearCachedData();
  } catch (e) {
    console.error("Logout cleanup error:", e);
  }

  // Reset dropdowns using safe DOM methods
  clearSelectOptions(senderIdSelect);
  addPlaceholderOption(senderIdSelect);

  clearSelectOptions(phoneColumnSelect);
  addPlaceholderOption(phoneColumnSelect);

  clearSelectOptions(messageColumnSelect);
  addPlaceholderOption(messageColumnSelect);

  sendPreview.style.display = "none";
  sendResult.style.display = "none";
  sendError.style.display = "none";

  showLoginSection();
}

// ---------------------------------------------------------------------------
// Safe DOM helpers for select elements
// ---------------------------------------------------------------------------

function clearSelectOptions(select: HTMLSelectElement): void {
  while (select.options.length > 0) {
    select.remove(0);
  }
}

function addPlaceholderOption(select: HTMLSelectElement): void {
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "-- Select --";
  select.appendChild(opt);
}

// ---------------------------------------------------------------------------
// Sender ID population
// ---------------------------------------------------------------------------

function populateSenderIds(senderIds: string[]): void {
  clearSelectOptions(senderIdSelect);

  if (senderIds.length === 0) {
    addPlaceholderOption(senderIdSelect);
    return;
  }

  senderIds.forEach((id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    senderIdSelect.appendChild(opt);
  });

  // Restore previously selected sender
  const savedSender = settings.getSelectedSenderId();
  if (savedSender && senderIds.includes(savedSender)) {
    senderIdSelect.value = savedSender;
  } else {
    senderIdSelect.value = senderIds[0];
  }
}

function populateCountryCodes(coverage: string[]): void {
  clearSelectOptions(countryCodeSelect);

  if (coverage.length === 0) {
    const opt = document.createElement("option");
    opt.value = "965";
    opt.textContent = "+965";
    countryCodeSelect.appendChild(opt);
    return;
  }

  const sorted = [...coverage].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  sorted.forEach((prefix) => {
    const opt = document.createElement("option");
    opt.value = prefix;
    opt.textContent = "+" + prefix;
    countryCodeSelect.appendChild(opt);
  });

  // Restore previously saved country code
  const savedCountry = settings.getDefaultCountryCode();
  if (savedCountry && coverage.includes(savedCountry)) {
    countryCodeSelect.value = savedCountry;
  } else if (coverage.includes("965")) {
    countryCodeSelect.value = "965";
  } else {
    countryCodeSelect.value = sorted[0];
  }
}

// ---------------------------------------------------------------------------
// Balance display
// ---------------------------------------------------------------------------

function updateBalanceDisplay(balance: number): void {
  balanceValue.textContent = String(balance);
}

// ---------------------------------------------------------------------------
// Column dropdowns
// ---------------------------------------------------------------------------

async function populateColumnDropdowns(): Promise<void> {
  try {
    const headers = await readFirstRowHeaders();

    const currentPhone = phoneColumnSelect.value;
    const currentMessage = messageColumnSelect.value;

    populateDropdown(phoneColumnSelect, headers, currentPhone);
    populateDropdown(messageColumnSelect, headers, currentMessage);

    // Trigger preview refresh
    handlePreviewUpdate();
  } catch (err: any) {
    console.error("populateColumnDropdowns error:", err);
  }
}

async function readFirstRowHeaders(): Promise<string[]> {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const usedRange = sheet.getUsedRange();
    usedRange.load("values,rowCount,columnCount");
    await context.sync();

    if (!usedRange || usedRange.rowCount === 0 || usedRange.columnCount === 0) {
      return [];
    }

    const firstRow = usedRange.values[0];
    const headers: string[] = [];
    for (let i = 0; i < firstRow.length; i++) {
      const cell = firstRow[i];
      headers.push(cell !== null && cell !== undefined ? String(cell) : "Column " + (i + 1));
    }
    return headers;
  });
}

function populateDropdown(select: HTMLSelectElement, headers: string[], currentValue: string): void {
  clearSelectOptions(select);
  addPlaceholderOption(select);

  headers.forEach((header, index) => {
    const opt = document.createElement("option");
    opt.value = String(index);
    opt.textContent = header;
    select.appendChild(opt);
  });

  // Restore previous selection if still valid
  if (currentValue !== "" && Number(currentValue) < headers.length) {
    select.value = currentValue;
  }
}

// ---------------------------------------------------------------------------
// Column data reader
// ---------------------------------------------------------------------------

async function readColumnData(columnIndex: number): Promise<string[]> {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const usedRange = sheet.getUsedRange();
    usedRange.load("values,rowCount,columnCount");
    await context.sync();

    if (!usedRange || usedRange.rowCount <= 1 || usedRange.columnCount <= columnIndex) {
      return [];
    }

    const results: string[] = [];
    for (let r = 1; r < usedRange.rowCount; r++) {
      const cell = usedRange.values[r][columnIndex];
      results.push(cell !== null && cell !== undefined ? String(cell) : "");
    }
    return results;
  });
}

// ---------------------------------------------------------------------------
// Template substitution: replaces {ColumnName} with row values
// ---------------------------------------------------------------------------

interface SheetData {
  headers: string[];
  rows: string[][];
}

async function readSheetData(): Promise<SheetData> {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const usedRange = sheet.getUsedRange();
    usedRange.load("values,rowCount,columnCount");
    await context.sync();

    if (!usedRange || usedRange.rowCount <= 1) {
      return { headers: [], rows: [] };
    }

    const headers: string[] = [];
    for (let c = 0; c < usedRange.columnCount; c++) {
      const h = usedRange.values[0][c];
      headers.push(h !== null && h !== undefined ? String(h) : "");
    }

    const rows: string[][] = [];
    for (let r = 1; r < usedRange.rowCount; r++) {
      const row: string[] = [];
      for (let c = 0; c < usedRange.columnCount; c++) {
        const cell = usedRange.values[r][c];
        row.push(cell !== null && cell !== undefined ? String(cell) : "");
      }
      rows.push(row);
    }

    return { headers, rows };
  });
}

function columnIndexToLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

function substituteTemplate(template: string, headers: string[], rowData: string[]): string {
  let result = template;

  // Replace all {placeholder} tokens (case-insensitive match against column names and letters)
  result = result.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const keyLower = key.trim().toLowerCase();

    // Try matching by column header name (case-insensitive)
    for (let c = 0; c < headers.length; c++) {
      if (headers[c].toLowerCase() === keyLower) {
        return rowData[c] || "";
      }
    }

    // Try matching by column letter (A, B, C...)
    for (let c = 0; c < headers.length; c++) {
      if (columnIndexToLetter(c).toLowerCase() === keyLower) {
        return rowData[c] || "";
      }
    }

    // No match: leave placeholder as-is
    return _match;
  });

  return result;
}

function templateHasPlaceholders(template: string): boolean {
  return /\{[^}]+\}/.test(template);
}

// ---------------------------------------------------------------------------
// Preview update
// ---------------------------------------------------------------------------

async function handlePreviewUpdate(): Promise<void> {
  const phoneColIndex = phoneColumnSelect.value;

  if (!phoneColIndex) {
    sendPreview.style.display = "none";
    sendBtn.disabled = true;
    return;
  }

  try {
    const rawPhones = await readColumnData(Number(phoneColIndex));
    const defaultCountry = countryCodeSelect.value || settings.getDefaultCountryCode();
    const cached = settings.getCachedData();
    const coverage = cached ? cached.coverage : [];

    let skippedCount = 0;
    const normalizedPhones: string[] = [];

    for (const raw of rawPhones) {
      if (!raw) continue;
      const normalized = normalize(raw, defaultCountry);
      if (!normalized) continue;
      const result = verify(normalized);
      if (!result.valid) continue;
      if (!hasCountryCoverage(normalized, coverage)) {
        skippedCount++;
        continue;
      }
      normalizedPhones.push(normalized);
    }

    // Only deduplicate when using a plain template with no placeholders and no message column.
    // When using message column or {ColumnName} placeholders, each row may have a unique message.
    const useMessageColumn = messageColumnSelect.value !== "";
    const usesPlaceholders = templateHasPlaceholders(messageTemplate.value);
    let validCount: number;
    let dupCount: number;

    if (useMessageColumn || usesPlaceholders) {
      validCount = normalizedPhones.length;
      dupCount = 0;
    } else {
      const deduped = deduplicate(normalizedPhones);
      validCount = deduped.unique.length;
      dupCount = deduped.removed.length;
    }

    previewValid.textContent = String(validCount);
    previewDuplicates.textContent = String(dupCount);
    previewSkipped.textContent = String(skippedCount);
    sendPreview.style.display = "";

    // Balance check for enabling send button
    const balance = cached ? cached.balance : 0;
    sendBtn.disabled = validCount === 0 || validCount > balance;
  } catch (err: any) {
    console.error("handlePreviewUpdate error:", err);
    sendPreview.style.display = "none";
    sendBtn.disabled = true;
  }
}

// ---------------------------------------------------------------------------
// Send flow
// ---------------------------------------------------------------------------

async function handleSend(): Promise<void> {
  sendResult.style.display = "none";
  sendResult.textContent = "";
  sendError.style.display = "none";
  sendError.textContent = "";

  const phoneColIndex = phoneColumnSelect.value;
  if (!phoneColIndex) {
    sendError.textContent = getString("noPhoneColumn");
    sendError.style.display = "";
    return;
  }

  const creds = settings.getCredentials();
  if (!creds) {
    showLoginSection();
    return;
  }

  const senderId = senderIdSelect.value;
  const testMode = testModeToggle.checked ? 1 : 0;
  const defaultCountry = countryCodeSelect.value || settings.getDefaultCountryCode();
  const cached = settings.getCachedData();
  const coverage = cached ? cached.coverage : [];
  const templateText = messageTemplate.value;

  // Disable send button during operation
  sendBtn.disabled = true;
  sendBtn.textContent = getString("sending");

  try {
    // 1. Read phone and message columns
    const rawPhones = await readColumnData(Number(phoneColIndex));

    const messageColIndex = messageColumnSelect.value;
    let rawMessages: string[] = [];
    if (messageColIndex !== "") {
      rawMessages = await readColumnData(Number(messageColIndex));
    }

    // Read full sheet data for template substitution if template has {ColumnName} placeholders
    let sheetData: SheetData | null = null;
    const usesPlaceholders = templateHasPlaceholders(templateText);
    if (usesPlaceholders) {
      sheetData = await readSheetData();
    }

    // 2. Validation pipeline
    const timestamp = new Date().toISOString();
    const logEntries: LogEntry[] = [];

    const validPhones: string[] = [];
    const validMessages: string[] = [];

    for (let i = 0; i < rawPhones.length; i++) {
      const raw = rawPhones[i];
      if (!raw) continue;

      // Get the raw message for this row (for logging even on failure)
      let rawMsg = templateText;
      if (messageColIndex !== "" && i < rawMessages.length) {
        rawMsg = rawMessages[i] || templateText;
      }
      // Apply {ColumnName} substitution if template has placeholders
      if (usesPlaceholders && sheetData && i < sheetData.rows.length) {
        rawMsg = substituteTemplate(rawMsg, sheetData.headers, sheetData.rows[i]);
      }

      const normalized = normalize(raw, defaultCountry);
      if (!normalized) {
        logEntries.push(
          makeLogEntry(timestamp, raw, rawMsg, senderId, "FAILED", "Invalid phone number", "", 0)
        );
        continue;
      }

      const verifyResult = verify(normalized);
      if (!verifyResult.valid) {
        logEntries.push(
          makeLogEntry(timestamp, normalized, rawMsg, senderId, "FAILED", "Failed phone validation", "", 0)
        );
        continue;
      }

      if (!hasCountryCoverage(normalized, coverage)) {
        logEntries.push(
          makeLogEntry(timestamp, normalized, rawMsg, senderId, "SKIPPED_NO_COVERAGE", "No coverage for this country", "", 0)
        );
        continue;
      }

      const msg = cleanMessage(rawMsg);

      if (!msg) {
        logEntries.push(
          makeLogEntry(timestamp, normalized, rawMsg, senderId, "FAILED", getString("emptyMessage"), "", 0)
        );
        continue;
      }

      validPhones.push(normalized);
      validMessages.push(msg);
    }

    // 3. Deduplication: only when using template (same message for all).
    //    When using message column, same phone with different messages sends separately.
    const useMessageColumn = messageColumnSelect.value !== "";
    const deduped: Array<{ phone: string; message: string }> = [];

    if (useMessageColumn) {
      // No dedup: each row is a unique phone+message pair
      for (let i = 0; i < validPhones.length; i++) {
        deduped.push({ phone: validPhones[i], message: validMessages[i] });
      }
    } else {
      // Dedup by phone number (same template message for all)
      const seen = new Set<string>();
      for (let i = 0; i < validPhones.length; i++) {
        const phone = validPhones[i];
        if (seen.has(phone)) {
          logEntries.push(
            makeLogEntry(timestamp, phone, validMessages[i], senderId, "SKIPPED_DUPLICATE", "Duplicate number", "", 0)
          );
        } else {
          seen.add(phone);
          deduped.push({ phone, message: validMessages[i] });
        }
      }
    }

    if (deduped.length === 0) {
      showSendError(getString("noValidNumbers"));
      return;
    }

    // 4. Balance pre-check (abort if insufficient, no partial sends)
    const balance = cached ? cached.balance : 0;
    if (deduped.length > balance) {
      showSendError(
        formatString(getString("insufficientBalance"), {
          needed: deduped.length,
          available: balance,
        })
      );
      return;
    }

    // 5. Ensure log sheet exists
    await ensureLogSheet();

    // 6. Batch sending
    let sentCount = 0;
    let failedCount = 0;
    let totalPointsCharged = 0;

    for (let batchStart = 0; batchStart < deduped.length; batchStart += BATCH_SIZE) {
      const batchItems = deduped.slice(batchStart, batchStart + BATCH_SIZE);

      // Group by message so same-message numbers can be sent in one API call
      const messageGroups = groupByMessage(batchItems);

      for (const message of Object.keys(messageGroups)) {
        const phones = messageGroups[message];
        const mobileParam = phones.join(",");

        try {
          const resp: SendResponse = await api.send(
            creds.username,
            creds.password,
            senderId,
            mobileParam,
            message,
            testMode
          );

          const pointsPerPhone = phones.length > 0 ? Math.round(resp["points-charged"] / phones.length) : 0;

          phones.forEach((phone) => {
            logEntries.push(
              makeLogEntry(timestamp, phone, message, senderId, "SENT", "", resp["msg-id"], pointsPerPhone)
            );
          });

          sentCount += phones.length;
          totalPointsCharged += resp["points-charged"];

          // Update balance after each batch call
          const balanceAfter = resp["balance-after"];
          await settings.updateBalance(balanceAfter);
          updateBalanceDisplay(balanceAfter);
        } catch (err: any) {
          const errMsg = err.message || "Send failed";
          phones.forEach((phone) => {
            logEntries.push(makeLogEntry(timestamp, phone, message, senderId, "FAILED", errMsg, "", 0));
          });
          failedCount += phones.length;
        }
      }

      // Delay between batches (except after the last batch)
      if (batchStart + BATCH_SIZE < deduped.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // 7. Log all entries
    if (logEntries.length > 0) {
      await logBatch(logEntries);
    }

    // 8. Show result summary
    const skippedCount = logEntries.filter(
      (e) => e.status === "SKIPPED_NO_COVERAGE" || e.status === "SKIPPED_DUPLICATE"
    ).length;

    showSendResult(sentCount, failedCount, skippedCount, totalPointsCharged);
  } catch (err: any) {
    showSendError(err.message || "Unexpected error during send");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = getString("sendButton");
    // Refresh preview counts
    handlePreviewUpdate();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLogEntry(
  timestamp: string,
  phone: string,
  message: string,
  senderId: string,
  status: SendStatus,
  errorDescription: string,
  msgId: string,
  pointsCharged: number
): LogEntry {
  return { timestamp, phone, message, senderId, status, errorDescription, msgId, pointsCharged };
}

function groupByMessage(items: Array<{ phone: string; message: string }>): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const item of items) {
    if (!groups[item.message]) {
      groups[item.message] = [];
    }
    groups[item.message].push(item.phone);
  }
  return groups;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showSendResult(sent: number, failed: number, skipped: number, pointsUsed: number): void {
  sendError.style.display = "none";
  sendError.textContent = "";

  // Build summary text safely using textContent only
  const parts: string[] = [
    formatString(getString("resultSent"), { count: sent }),
    formatString(getString("resultFailed"), { count: failed }),
    formatString(getString("resultSkipped"), { count: skipped }),
    formatString(getString("resultPointsUsed"), { count: pointsUsed }),
  ];

  sendResult.textContent = parts.join("  |  ");
  sendResult.style.display = "";
}

function showSendError(message: string): void {
  sendResult.style.display = "none";
  sendResult.textContent = "";
  sendError.textContent = message;
  sendError.style.display = "";
}
