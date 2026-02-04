import type { CsvOptions } from "./types";

/**
 * CSVデータを指定形式で文字列に変換
 */
export function exportCsv(
  data: string[][],
  options: CsvOptions
): string {
  const { delimiter, quoteChar, lineEnding } = options;
  const lineEnd = lineEnding === "CRLF" ? "\r\n" : "\n";

  return data
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          if (!quoteChar) return str;
          const needsQuote =
            str.includes(delimiter) ||
            str.includes('"') ||
            str.includes("\n") ||
            str.includes("\r");
          if (!needsQuote) return str;
          return `${quoteChar}${str.replace(/"/g, '""')}${quoteChar}`;
        })
        .join(delimiter)
    )
    .join(lineEnd);
}
