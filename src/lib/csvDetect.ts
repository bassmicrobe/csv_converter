import iconv from "iconv-lite";
import type {
  Charset,
  CsvOptions,
  Delimiter,
  LineEnding,
  QuoteChar,
} from "./types";

export interface DetectResult {
  text: string;
  options: CsvOptions;
}

/**
 * ファイルの内容からCSV形式を自動判別する
 */
export async function detectAndReadCsv(file: File): Promise<DetectResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const charset = detectCharset(buffer);
  let text: string;
  try {
    text =
      charset === "Shift_JIS"
        ? iconv.decode(buffer as Buffer, "shiftjis")
        : new TextDecoder("utf-8").decode(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `文字コードの解釈に失敗しました（${charset} として判定）。\n` +
        `別の文字コードで保存し直すか、UTF-8（BOM あり）で保存してください。\n` +
        `詳細: ${msg}`,
    );
  }

  const lineEnding = detectLineEnding(buffer);
  const delimiter = detectDelimiter(text);
  const quoteChar = detectQuoteChar(text, delimiter);

  return {
    text,
    options: {
      charset,
      delimiter,
      quoteChar,
      lineEnding,
    },
  };
}

function detectCharset(buffer: Uint8Array): Charset {
  // BOM チェック
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return "UTF-8";
  }

  // UTF-8 でデコードして Replacement Character が含まれるかチェック
  const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!utf8Text.includes("\ufffd")) {
    return "UTF-8";
  }

  return "Shift_JIS";
}

function detectLineEnding(buffer: Uint8Array): LineEnding {
  let crlfCount = 0;
  let lfCount = 0;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === 0x0d && buffer[i + 1] === 0x0a) crlfCount++;
    else if (buffer[i] === 0x0a && buffer[i - 1] !== 0x0d) lfCount++;
  }
  if (
    buffer[buffer.length - 1] === 0x0a &&
    buffer[buffer.length - 2] !== 0x0d
  ) {
    lfCount++;
  }
  return crlfCount > lfCount ? "CRLF" : "LF";
}

function detectDelimiter(text: string): Delimiter {
  const lines = text.split(/\r\n|\r|\n/).slice(0, 10);
  let commaScore = 0;
  let tabScore = 0;
  let prevCommaCount = -1;
  let prevTabCount = -1;

  for (const line of lines) {
    if (!line.trim()) continue;
    const commaCount = (line.match(/,/g) ?? []).length;
    const tabCount = (line.match(/\t/g) ?? []).length;

    if (tabCount > 0) {
      if (prevTabCount >= 0 && tabCount === prevTabCount) tabScore += 2;
      else tabScore += 1;
      prevTabCount = tabCount;
    }
    if (commaCount > 0) {
      if (prevCommaCount >= 0 && commaCount === prevCommaCount) commaScore += 2;
      else commaScore += 1;
      prevCommaCount = commaCount;
    }
  }

  return tabScore > commaScore ? "\t" : ",";
}

function detectQuoteChar(text: string, _delimiter: Delimiter): QuoteChar {
  const sample = text.slice(0, 2000);
  const quoteCount = (sample.match(/"/g) ?? []).length;
  if (quoteCount >= 2) {
    return '"';
  }
  return "";
}
