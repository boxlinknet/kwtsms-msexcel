// src/services/logger.ts
// Writes SMS send log entries to a dedicated "kwtsms_logs" Excel sheet.
// Creates the sheet with headers if it doesn't exist.
// Related: src/models/types.ts, .claude/skills/excel-integration/SKILL.md

import { LogEntry } from "../models/types";

const SHEET_NAME = "kwtsms_logs";
const HEADERS = [
  "Timestamp",
  "Phone",
  "Message",
  "Sender ID",
  "Status",
  "Error Description",
  "Msg ID",
  "Points Charged",
];

export async function ensureLogSheet(): Promise<void> {
  await Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    sheets.load("items/name");
    await context.sync();

    const exists = sheets.items.some((s) => s.name === SHEET_NAME);
    if (!exists) {
      const sheet = sheets.add(SHEET_NAME);
      const headerRange = sheet.getRangeByIndexes(0, 0, 1, HEADERS.length);
      headerRange.values = [HEADERS];
      headerRange.format.font.bold = true;
      headerRange.format.autofitColumns();
      await context.sync();
    }
  });
}

export async function logSend(entry: LogEntry): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(SHEET_NAME);
    const usedRange = sheet.getUsedRange();
    usedRange.load("rowCount");
    await context.sync();

    const nextRow = usedRange.rowCount;
    const newRange = sheet.getRangeByIndexes(nextRow, 0, 1, HEADERS.length);
    newRange.values = [[
      entry.timestamp,
      entry.phone,
      entry.message,
      entry.senderId,
      entry.status,
      entry.errorDescription,
      entry.msgId,
      entry.pointsCharged,
    ]];
    await context.sync();
  });
}

export async function logBatch(entries: LogEntry[]): Promise<void> {
  if (entries.length === 0) return;

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(SHEET_NAME);
    const usedRange = sheet.getUsedRange();
    usedRange.load("rowCount");
    await context.sync();

    const nextRow = usedRange.rowCount;
    const rows = entries.map((e) => [
      e.timestamp,
      e.phone,
      e.message,
      e.senderId,
      e.status,
      e.errorDescription,
      e.msgId,
      e.pointsCharged,
    ]);
    const newRange = sheet.getRangeByIndexes(nextRow, 0, entries.length, HEADERS.length);
    newRange.values = rows;
    await context.sync();
  });
}
