import { describe, expect, it } from "vitest";
import { MAX_QR, selectQrRows } from "./qrRows";

describe("QR export row selection", () => {
  const data = [["name"], ["visible"], ["private"]];

  it("does not expose unfiltered rows when a search has no matches", () => {
    expect(selectQrRows(data, true, [])).toEqual({ rows: [], totalRows: 0 });
    expect(selectQrRows(data, true, [1])).toEqual({
      rows: [data[1]],
      totalRows: 1,
    });
  });

  it("excludes headers and stale indices after rows are removed", () => {
    expect(selectQrRows(data, true, [0, 2, 3, -1, 1.5])).toEqual({
      rows: [data[2]],
      totalRows: 1,
    });
    expect(selectQrRows([["header"]], true, null)).toEqual({
      rows: [],
      totalRows: 0,
    });
  });

  it("limits generated rows while retaining the full matching row count", () => {
    const largeData = Array.from({ length: 50_000 }, (_, index) => [
      String(index),
    ]);
    const result = selectQrRows(largeData, true, null);
    expect(result.totalRows).toBe(49_999);
    expect(result.rows).toHaveLength(MAX_QR);
    expect(result.rows[0]).toBe(largeData[1]);
    expect(result.rows.at(-1)).toBe(largeData[MAX_QR]);
    expect(
      selectQrRows(
        largeData,
        false,
        largeData.map((_, i) => i),
      ).rows,
    ).toHaveLength(MAX_QR);
  });
});
