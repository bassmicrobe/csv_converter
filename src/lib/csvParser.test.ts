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
});
