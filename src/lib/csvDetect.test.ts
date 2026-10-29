import iconv from "iconv-lite";
import { describe, expect, it } from "vitest";
import { detectAndReadCsv } from "./csvDetect";
import { readFileAsText } from "./fileLoader";

function csvFile(bytes: Uint8Array): File {
  return new File([new Uint8Array(bytes)], "example.csv", { type: "text/csv" });
}

describe("CSV encoding detection", () => {
  it("loads UTF-8 and UTF-8 BOM while preserving real replacement characters", async () => {
    const text = "名前,備考\n東京,置換文字\ufffd";
    const bytes = new TextEncoder().encode(text);
    const plain = await detectAndReadCsv(csvFile(bytes));
    expect(plain.text).toBe(text);
    expect(plain.options.charset).toBe("UTF-8");
    const bom = await detectAndReadCsv(
      csvFile(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes])),
    );
    expect(bom.text).toBe(text);
    expect(bom.options.charset).toBe("UTF-8");
  });

  it("loads Japanese Shift_JIS through the deferred codec", async () => {
    const text = "名前\t値\r\n東京\tテスト\r\n大阪\t確認";
    const file = csvFile(iconv.encode(text, "shiftjis"));
    const result = await detectAndReadCsv(file);
    expect(result.text).toBe(text);
    expect(result.options).toMatchObject({
      charset: "Shift_JIS",
      delimiter: "\t",
      lineEnding: "CRLF",
    });
    expect(await readFileAsText(file, "Shift_JIS")).toBe(text);
  });
});
