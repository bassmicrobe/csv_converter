export const MAX_CSV_ROWS = 50_000;
const MAX_HISTORY = 30;

export interface CsvSnapshot {
  data: string[][];
  columnOrder: number[];
}

export interface CsvEditorHistory {
  entries: CsvSnapshot[];
  index: number;
}

type CsvEdit =
  | { type: "updateCell"; row: number; column: number; value: string }
  | { type: "addRow" }
  | { type: "addColumn" }
  | { type: "deleteRow"; row: number }
  | { type: "deleteColumn"; column: number }
  | { type: "clearRow"; row: number }
  | { type: "clearColumn"; column: number }
  | { type: "reorderColumns"; order: number[] };

export type CsvEditorAction =
  | CsvEdit
  | { type: "replace"; snapshot: CsvSnapshot }
  | { type: "undo" }
  | { type: "redo" };

export function createCsvHistory(snapshot: CsvSnapshot): CsvEditorHistory {
  return { entries: [snapshot], index: 0 };
}

function validIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

function editSnapshot(current: CsvSnapshot, action: CsvEdit): CsvSnapshot {
  const { data, columnOrder } = current;
  switch (action.type) {
    case "updateCell": {
      if (
        !validIndex(action.row, data.length) ||
        !validIndex(action.column, columnOrder.length) ||
        (data[action.row][action.column] ?? "") === action.value
      ) {
        return current;
      }
      const row = [...data[action.row]];
      while (row.length <= action.column) row.push("");
      row[action.column] = action.value;
      const next = [...data];
      next[action.row] = row;
      return { data: next, columnOrder };
    }
    case "addRow": {
      if (data.length >= MAX_CSV_ROWS) return current;
      const columns = columnOrder.length || 1;
      return {
        data: [...data, Array.from({ length: columns }, () => "")],
        columnOrder: columnOrder.length ? columnOrder : [0],
      };
    }
    case "addColumn":
      return {
        data: data.map((row) =>
          Array.from(
            { length: columnOrder.length + 1 },
            (_, index) => row[index] ?? "",
          ),
        ),
        columnOrder: [...columnOrder, columnOrder.length],
      };
    case "deleteRow":
      return validIndex(action.row, data.length)
        ? { data: data.filter((_, index) => index !== action.row), columnOrder }
        : current;
    case "deleteColumn": {
      if (!validIndex(action.column, columnOrder.length)) return current;
      const actualColumn = columnOrder[action.column];
      return {
        data: data.map((row) =>
          row.filter((_, index) => index !== actualColumn),
        ),
        columnOrder: columnOrder
          .filter((index) => index !== actualColumn)
          .map((index) => (index > actualColumn ? index - 1 : index)),
      };
    }
    case "clearRow": {
      if (
        !validIndex(action.row, data.length) ||
        data[action.row].every((cell) => cell === "")
      ) {
        return current;
      }
      const next = [...data];
      next[action.row] = data[action.row].map(() => "");
      return { data: next, columnOrder };
    }
    case "clearColumn": {
      if (!validIndex(action.column, columnOrder.length)) return current;
      const actualColumn = columnOrder[action.column];
      let changed = false;
      const next = data.map((row) => {
        if (!row[actualColumn]) return row;
        changed = true;
        const copy = [...row];
        copy[actualColumn] = "";
        return copy;
      });
      return changed ? { data: next, columnOrder } : current;
    }
    case "reorderColumns":
      if (
        action.order.length !== columnOrder.length ||
        new Set(action.order).size !== columnOrder.length ||
        action.order.some((index) => !validIndex(index, columnOrder.length)) ||
        action.order.every((column, index) => column === columnOrder[index])
      ) {
        return current;
      }
      return { data, columnOrder: [...action.order] };
  }
}

// Each edit copies only the changed row(s). Previous snapshots remain immutable
// and share untouched rows instead of duplicating all cells for every undo step.
export function csvEditorReducer(
  state: CsvEditorHistory,
  action: CsvEditorAction,
): CsvEditorHistory {
  if (action.type === "replace") return createCsvHistory(action.snapshot);
  if (action.type === "undo") {
    return state.index > 0 ? { ...state, index: state.index - 1 } : state;
  }
  if (action.type === "redo") {
    return state.index < state.entries.length - 1
      ? { ...state, index: state.index + 1 }
      : state;
  }

  const current = state.entries[state.index];
  const next = editSnapshot(current, action);
  if (next === current) return state;
  const entries = [...state.entries.slice(0, state.index + 1), next].slice(
    -MAX_HISTORY,
  );
  return { entries, index: entries.length - 1 };
}
