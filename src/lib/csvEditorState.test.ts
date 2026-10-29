import { describe, expect, it } from "vitest";
import {
  createCsvHistory,
  csvEditorReducer,
  MAX_CSV_ROWS,
} from "./csvEditorState";

const initial = () =>
  createCsvHistory({
    data: [
      ["name", "value"],
      ["a", "1"],
      ["b", "2"],
    ],
    columnOrder: [0, 1],
  });

describe("CSV edit history", () => {
  it("copies only the edited row of a 50,000-row file and preserves undo data", () => {
    const data = Array.from({ length: MAX_CSV_ROWS }, (_, index) => [
      String(index),
      "old",
    ]);
    const state = createCsvHistory({ data, columnOrder: [0, 1] });
    const edited = csvEditorReducer(state, {
      type: "updateCell",
      row: 25_000,
      column: 1,
      value: "new",
    });
    const next = edited.entries[edited.index];
    expect(next.data).not.toBe(data);
    expect(next.data.filter((row, index) => row !== data[index])).toHaveLength(
      1,
    );
    expect(data[25_000][1]).toBe("old");
    expect(next.data[25_000][1]).toBe("new");
    const undone = csvEditorReducer(edited, { type: "undo" });
    expect(undone.entries[undone.index].data).toBe(data);
    const redone = csvEditorReducer(undone, { type: "redo" });
    expect(redone.entries[redone.index]).toBe(next);
  });

  it("applies sequential edits against the latest snapshot and drops only the redo branch", () => {
    let state = initial();
    state = csvEditorReducer(state, {
      type: "updateCell",
      row: 1,
      column: 1,
      value: "3",
    });
    state = csvEditorReducer(state, {
      type: "updateCell",
      row: 2,
      column: 1,
      value: "4",
    });
    expect(state.entries[state.index].data).toEqual([
      ["name", "value"],
      ["a", "3"],
      ["b", "4"],
    ]);
    state = csvEditorReducer(state, { type: "undo" });
    state = csvEditorReducer(state, {
      type: "updateCell",
      row: 2,
      column: 1,
      value: "5",
    });
    expect(state.entries).toHaveLength(3);
    expect(state.entries[state.index].data[2][1]).toBe("5");
    expect(csvEditorReducer(state, { type: "redo" })).toBe(state);
  });

  it("bounds history without losing the latest state", () => {
    let state = initial();
    for (let value = 0; value < 50; value++) {
      state = csvEditorReducer(state, {
        type: "updateCell",
        row: 1,
        column: 1,
        value: String(value),
      });
    }
    expect(state.entries).toHaveLength(30);
    expect(state.index).toBe(29);
    expect(state.entries[state.index].data[1][1]).toBe("49");
  });

  it("keeps data shared when reordering and respects physical columns on deletion", () => {
    const state = initial();
    const reordered = csvEditorReducer(state, {
      type: "reorderColumns",
      order: [1, 0],
    });
    expect(reordered.entries[1].data).toBe(state.entries[0].data);
    const removed = csvEditorReducer(reordered, {
      type: "deleteColumn",
      column: 0,
    });
    expect(removed.entries[removed.index]).toEqual({
      data: [["name"], ["a"], ["b"]],
      columnOrder: [0],
    });
    expect(state.entries[0].data[0]).toEqual(["name", "value"]);
  });

  it("ignores invalid/no-op edits and enforces the row limit", () => {
    const state = initial();
    expect(
      csvEditorReducer(state, {
        type: "updateCell",
        row: 1,
        column: 1,
        value: "1",
      }),
    ).toBe(state);
    expect(csvEditorReducer(state, { type: "deleteRow", row: -1 })).toBe(state);
    expect(
      csvEditorReducer(state, { type: "reorderColumns", order: [0, 0] }),
    ).toBe(state);
    const atLimit = createCsvHistory({
      data: Array.from({ length: MAX_CSV_ROWS }, () => [""]),
      columnOrder: [0],
    });
    expect(csvEditorReducer(atLimit, { type: "addRow" })).toBe(atLimit);
  });

  it("pads ragged rows when adding a column and shares untouched cleared rows", () => {
    const state = createCsvHistory({
      data: [["a"], ["b", "c"], ["", ""]],
      columnOrder: [0, 1],
    });
    const added = csvEditorReducer(state, { type: "addColumn" });
    expect(added.entries[1].data).toEqual([
      ["a", "", ""],
      ["b", "c", ""],
      ["", "", ""],
    ]);
    const cleared = csvEditorReducer(state, { type: "clearColumn", column: 1 });
    expect(cleared.entries[1].data[0]).toBe(state.entries[0].data[0]);
    expect(cleared.entries[1].data[2]).toBe(state.entries[0].data[2]);
    expect(cleared.entries[1].data[1]).toEqual(["b", ""]);
  });
});
