import type { CsvOptions } from "./types";

export interface ParseResult {
  data: string[][];
  error?: string;
}

/**
 * CSVをパースする。ユーザー指定の形式のみ使用。自動判定は行わない。
 */
export function parseCsv(
  rawText: string,
  options: Pick<CsvOptions, "delimiter" | "quoteChar">
): ParseResult {
  const { delimiter, quoteChar } = options;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  const pushCell = () => {
    currentRow.push(currentCell);
    currentCell = "";
  };

  const pushRow = () => {
    pushCell();
    rows.push(currentRow);
    currentRow = [];
  };

  while (i < rawText.length) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (quoteChar && char === quoteChar) {
      if (inQuotes) {
        if (nextChar === quoteChar) {
          currentCell += quoteChar;
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        inQuotes = true;
      }
      i++;
      continue;
    }

    if (inQuotes) {
      if (char === "\n" || char === "\r") {
        currentCell += char;
      } else {
        currentCell += char;
      }
      i++;
      continue;
    }

    if (char === delimiter) {
      pushCell();
      i++;
      continue;
    }

    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }

    if (char === "\r") {
      if (nextChar === "\n") {
        pushRow();
        i += 2;
      } else {
        pushRow();
        i++;
      }
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell || currentRow.length > 0) {
    pushRow();
  }

  return { data: rows };
}
