import { describe, expect, it } from "vitest";
import { filterRowIndices, sortRowIndices } from "./csvView";

describe("CSV filtering and sorting", () => {
  const data = [["Name"], ["beta"], ["Alpha"], ["alpha"], ["zeta"]];

  it("excludes the header, preserves zero matches, and resets an empty query", () => {
    expect(filterRowIndices(data, 0, "name", 1)).toEqual([]);
    expect(filterRowIndices(data, 0, "ALPHA", 1)).toEqual([2, 3]);
    expect(filterRowIndices(data, 0, " ", 1)).toBeNull();
  });

  it("returns source row indices in stable case-insensitive order without mutating input", () => {
    const indices = [1, 2, 3, 4];
    expect(sortRowIndices(data, indices, 0, "asc")).toEqual([2, 3, 1, 4]);
    expect(sortRowIndices(data, indices, 0, "desc")).toEqual([4, 1, 2, 3]);
    expect(indices).toEqual([1, 2, 3, 4]);
    expect(data[2]).toEqual(["Alpha"]);
  });
});
