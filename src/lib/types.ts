export type Charset = "UTF-8" | "Shift_JIS";
export type Delimiter = "," | "\t";
export type QuoteChar = '"' | "";
export type LineEnding = "LF" | "CRLF";

export interface CsvOptions {
  charset: Charset;
  delimiter: Delimiter;
  quoteChar: QuoteChar;
  lineEnding: LineEnding;
}

export const DEFAULT_CSV_OPTIONS: CsvOptions = {
  charset: "UTF-8",
  delimiter: ",",
  quoteChar: '"',
  lineEnding: "LF",
};
