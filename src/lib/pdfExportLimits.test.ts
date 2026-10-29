import { describe, expect, it } from "vitest";
import { getPdfLimitError } from "./pdfExportLimits";

describe("PDF resource bounds", () => {
  it("allows the exact limit and rejects extra rows before rendering a table", () => {
    const data = Array.from({ length: 500 }, () => Array(20).fill(""));
    expect(getPdfLimitError(data)).toBeNull();
    expect(getPdfLimitError([...data, [""]])).toContain("CSV");
  });

  it("counts every displayed column including ragged rows", () => {
    const data = Array.from({ length: 500 }, () => [""]);
    data[499] = Array(21).fill("");
    expect(getPdfLimitError(data)).toContain("10,000セル");
    expect(getPdfLimitError(data, [0])).toBeNull();
  });
});
