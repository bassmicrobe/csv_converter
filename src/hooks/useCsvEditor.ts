"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import {
  createCsvHistory,
  csvEditorReducer,
  MAX_CSV_ROWS,
} from "@/lib/csvEditorState";
import { type CsvOptions, DEFAULT_CSV_OPTIONS } from "@/lib/types";

export function useCsvEditor() {
  const [history, dispatch] = useReducer(csvEditorReducer, undefined, () =>
    createCsvHistory({ data: [], columnOrder: [] }),
  );
  const [options, setOptions] = useState<CsvOptions>(DEFAULT_CSV_OPTIONS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadRequest = useRef(0);
  const { data, columnOrder } = history.entries[history.index];

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const loadFile = useCallback(async (file: File) => {
    const request = ++loadRequest.current;
    setLoadError(null);
    try {
      const [{ detectAndReadCsv }, { parseCsv }] = await Promise.all([
        import("@/lib/csvDetect"),
        import("@/lib/csvParser"),
      ]);
      if (request !== loadRequest.current) return;
      const { text, options: detectedOptions } = await detectAndReadCsv(file);
      if (request !== loadRequest.current) return;
      const result = parseCsv(text, {
        delimiter: detectedOptions.delimiter,
        quoteChar: detectedOptions.quoteChar,
        maxRows: MAX_CSV_ROWS,
      });
      if (result.error) {
        setLoadError(
          result.errorDetail ? `構文エラー\n${result.error}` : result.error,
        );
        return;
      }

      const columns = result.data.reduce(
        (maximum, row) => Math.max(maximum, row.length),
        0,
      );
      dispatch({
        type: "replace",
        snapshot: {
          data: result.data,
          columnOrder: Array.from({ length: columns }, (_, index) => index),
        },
      });
      setOptions(detectedOptions);
    } catch (err) {
      if (request !== loadRequest.current) return;
      const message =
        err instanceof Error ? err.message : "ファイルの読み込みに失敗しました";
      setLoadError(
        message.includes("\n") ? `読み込みエラー\n${message}` : message,
      );
    }
  }, []);

  const updateCell = useCallback(
    (row: number, column: number, value: string) => {
      dispatch({ type: "updateCell", row, column, value });
    },
    [],
  );
  const addRow = useCallback(() => dispatch({ type: "addRow" }), []);
  const addColumn = useCallback(() => dispatch({ type: "addColumn" }), []);
  const deleteRow = useCallback((row: number) => {
    dispatch({ type: "deleteRow", row });
  }, []);
  const deleteColumn = useCallback((column: number) => {
    dispatch({ type: "deleteColumn", column });
  }, []);
  const clearRow = useCallback((row: number) => {
    dispatch({ type: "clearRow", row });
  }, []);
  const clearColumn = useCallback((column: number) => {
    dispatch({ type: "clearColumn", column });
  }, []);
  const reorderColumns = useCallback((order: number[]) => {
    dispatch({ type: "reorderColumns", order });
  }, []);

  const setExportOptions = useCallback((updates: Partial<CsvOptions>) => {
    setOptions((previous) => ({ ...previous, ...updates }));
  }, []);

  const clearData = useCallback(() => {
    loadRequest.current++;
    dispatch({ type: "replace", snapshot: { data: [], columnOrder: [] } });
    setLoadError(null);
  }, []);

  const createNew = useCallback((rows = 1, columns = 4) => {
    loadRequest.current++;
    setLoadError(null);
    const rowCount = Math.min(MAX_CSV_ROWS, Math.max(1, Math.floor(rows)));
    const columnCount = Math.max(1, Math.floor(columns));
    dispatch({
      type: "replace",
      snapshot: {
        data: Array.from({ length: rowCount }, () =>
          Array.from({ length: columnCount }, () => ""),
        ),
        columnOrder: Array.from({ length: columnCount }, (_, index) => index),
      },
    });
    setOptions(DEFAULT_CSV_OPTIONS);
  }, []);

  return {
    data,
    options,
    columnOrder,
    loadFile,
    updateCell,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    clearRow,
    clearColumn,
    reorderColumns,
    setExportOptions,
    clearData,
    createNew,
    undo,
    redo,
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1,
    loadError,
    columnCount: columnOrder.length,
    rowCount: data.length,
  };
}
