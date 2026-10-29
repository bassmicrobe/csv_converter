import { describe, expect, it } from "vitest";
import { parseCsv } from "./csvParser";

describe("parseCsv", () => {
  it("parses comma-separated rows", () => {
    const r = parseCsv("a,b\n1,2", { delimiter: ",", quoteChar: '"' });
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted commas", () => {
    const r = parseCsv('"a,b",c', { delimiter: ",", quoteChar: '"' });
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual([["a,b", "c"]]);
  });

  it("preserves a final quoted empty record", () => {
    expect(parseCsv('""', { delimiter: ",", quoteChar: '"' }).data).toEqual([
      [""],
    ]);
    expect(parseCsv('a\n""', { delimiter: ",", quoteChar: '"' }).data).toEqual([
      ["a"],
      [""],
    ]);
  });

  it("stops at the record limit instead of parsing the rest of an oversized file", () => {
    const options = { delimiter: ",", quoteChar: '"', maxRows: 2 } as const;
    expect(parseCsv("a\nb\n", options)).toEqual({ data: [["a"], ["b"]] });
    const result = parseCsv('a\nb\nc\n"unterminated', options);
    expect(result.data).toEqual([]);
    expect(result.error).toContain("2行");
    expect(result.errorDetail).toBeUndefined();
  });

  it("counts quoted multiline values as one record and reports physical error lines", () => {
    const result = parseCsv('"a\nb",c\n"unterminated', {
      delimiter: ",",
      quoteChar: '"',
      maxRows: 2,
    });
    expect(result.errorDetail?.line).toBe(3);
    expect(
      parseCsv('"a\nb",c\nnext,row', {
        delimiter: ",",
        quoteChar: '"',
        maxRows: 2,
      }).data,
    ).toHaveLength(2);
  });
});
