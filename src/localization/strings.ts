// src/localization/strings.ts
// All UI strings keyed by locale. English for v1, Arabic placeholder for v1.1.
// Related: src/taskpane/taskpane.ts

export interface LocaleStrings {
  loginTitle: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  loginButton: string;
  loginError: string;
  loggingIn: string;
  balanceLabel: string;
  senderIdLabel: string;
  testModeLabel: string;
  logoutButton: string;
  phoneColumnLabel: string;
  messageColumnLabel: string;
  refreshColumnsButton: string;
  countryCodeLabel: string;
  messageTemplateLabel: string;
  messageTemplatePlaceholder: string;
  sendButton: string;
  sending: string;
  previewValid: string;
  previewDuplicates: string;
  previewSkipped: string;
  resultSent: string;
  resultFailed: string;
  resultSkipped: string;
  resultPointsUsed: string;
  noPhoneColumn: string;
  noValidNumbers: string;
  insufficientBalance: string;
  emptyMessage: string;
  supportLink: string;
  version: string;
}

const en: LocaleStrings = {
  loginTitle: "Login to kwtSMS API",
  usernamePlaceholder: "API Username",
  passwordPlaceholder: "API Password",
  loginButton: "Login",
  loginError: "Invalid credentials or service unavailable",
  loggingIn: "Logging in...",
  balanceLabel: "Balance",
  senderIdLabel: "Sender ID",
  testModeLabel: "Test Mode",
  logoutButton: "Logout",
  phoneColumnLabel: "Phone column",
  messageColumnLabel: "Message column (optional)",
  refreshColumnsButton: "Refresh columns",
  countryCodeLabel: "Country code",
  messageTemplateLabel: "Message template",
  messageTemplatePlaceholder: "Type your message here (used for all recipients if no message column selected)",
  sendButton: "Send SMS",
  sending: "Sending...",
  previewValid: "{count} valid numbers",
  previewDuplicates: "{count} duplicates removed",
  previewSkipped: "{count} skipped (no coverage)",
  resultSent: "Sent: {count}",
  resultFailed: "Failed: {count}",
  resultSkipped: "Skipped: {count}",
  resultPointsUsed: "Points used: {count}",
  noPhoneColumn: "Select a phone column",
  noValidNumbers: "No valid phone numbers found",
  insufficientBalance: "Insufficient balance: {needed} messages to send, {available} points available",
  emptyMessage: "Message is empty after cleaning",
  supportLink: "Support",
  version: "v{version}",
};

const LOCALES: Record<string, LocaleStrings> = { en };

export function getString(key: keyof LocaleStrings, locale: string = "en"): string {
  const strings = LOCALES[locale] || LOCALES.en;
  return strings[key];
}

export function formatString(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace("{" + key + "}", String(value));
  }
  return result;
}
