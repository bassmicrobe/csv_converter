import type { CsvOptions } from "./types";

export interface ParseResult {
  data: string[][];
  error?: string;
  errorDetail?: { line: number; message: string };
}

/**
 * CSVをパースする。ユーザー指定の形式のみ使用。自動判定は行わない。
 */
export function parseCsv(
  rawText: string,
  options: Pick<CsvOptions, "delimiter" | "quoteChar"> & { maxRows?: number },
): ParseResult {
  const { delimiter, quoteChar } = options;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;
  let currentLine = 1;
  let quoteStartLine = 0;
  let hasQuotedCell = false;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const rowLimitError = (): ParseResult => ({
    data: [],
    error: `行数が上限（${maxRows.toLocaleString()}行）を超えています。処理負荷が高くなるため読み込みを中断しました。`,
  });

  const pushCell = () => {
    currentRow.push(currentCell);
    currentCell = "";
  };

  const pushRow = () => {
    if (rows.length >= maxRows) return false;
    pushCell();
    rows.push(currentRow);
    currentRow = [];
    hasQuotedCell = false;
    return true;
  };

  while (i < rawText.length) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (quoteChar && char === quoteChar) {
      hasQuotedCell = true;
      if (inQuotes) {
        if (nextChar === quoteChar) {
          currentCell += quoteChar;
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        inQuotes = true;
        quoteStartLine = currentLine;
      }
      i++;
      continue;
    }

    if (inQuotes) {
      currentCell += char;
      if (char === "\r" || (char === "\n" && rawText[i - 1] !== "\r")) {
        currentLine++;
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
      if (!pushRow()) return rowLimitError();
      currentLine++;
      i++;
      continue;
    }

    if (char === "\r") {
      if (!pushRow()) return rowLimitError();
      currentLine++;
      if (nextChar === "\n") {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell || currentRow.length > 0 || hasQuotedCell) {
    if (!pushRow()) return rowLimitError();
  }

  if (inQuotes && quoteChar) {
    const message = `行 ${quoteStartLine}: 閉じられていない引用符（${quoteChar === '"' ? "ダブルクォート" : "囲み文字"}）があります。引用符で囲んだフィールドは、対応する閉じる引用符で終わる必要があります。`;
    return {
      data: [],
      error: message,
      errorDetail: { line: quoteStartLine, message },
    };
  }

  return { data: rows };
}
