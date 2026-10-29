import type { Charset } from "./types";

/**
 * ファイルをArrayBufferとして読み込み、指定文字コードでデコード
 */
export async function readFileAsText(
  file: File,
  charset: Charset,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  if (charset === "Shift_JIS") {
    const { default: iconv } = await import("iconv-lite");
    return iconv.decode(buffer as Buffer, "shiftjis");
  }
  return new TextDecoder("utf-8").decode(arrayBuffer);
}
