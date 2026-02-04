"use client";

import { useCallback, useState } from "react";
import { detectAndReadCsv } from "@/lib/csvDetect";
import { parseCsv } from "@/lib/csvParser";
import type { CsvOptions } from "@/lib/types";

const MAX_ROWS = 50_000;
const MAX_HISTORY = 30;

function deepCopyData(d: string[][]): string[][] {
  return d.map((row) => [...row]);
}

export function useCsvEditor() {
  const [history, setHistory] = useState<{ data: string[][]; columnOrder: number[] }[]>([
    { data: [], columnOrder: [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [options, setOptions] = useState<CsvOptions>({
    charset: "UTF-8",
    delimiter: ",",
    quoteChar: '"',
    lineEnding: "LF",
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  const data = history[historyIndex].data;
  const columnOrder = history[historyIndex].columnOrder;

  const pushState = useCallback((newData: string[][], newColumnOrder: number[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [
        ...trimmed,
        { data: deepCopyData(newData), columnOrder: [...newColumnOrder] },
      ];
      return next.slice(-MAX_HISTORY);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((prev) =>
      prev < history.length - 1 ? prev + 1 : prev
    );
  }, [history.length]);

  const loadFile = useCallback(async (file: File) => {
    setLoadError(null);
    try {
      const { text, options: detectedOptions } = await detectAndReadCsv(file);
      const result = parseCsv(text, {
        delimiter: detectedOptions.delimiter,
        quoteChar: detectedOptions.quoteChar,
      });

      if (result.error) {
        setLoadError(
          result.errorDetail ? `構文エラー\n${result.error}` : result.error
        );
        return;
      }

      if (result.data.length > MAX_ROWS) {
        setLoadError(
          `行数が上限（${MAX_ROWS.toLocaleString()}行）を超えています。処理負荷が高くなるため読み込みを中断しました。`
        );
        return;
      }

      const cols = result.data[0]?.length ?? 0;
      const newColumnOrder = Array.from({ length: cols }, (_, i) => i);
      setHistory([{ data: deepCopyData(result.data), columnOrder: newColumnOrder }]);
      setHistoryIndex(0);
      setOptions(detectedOptions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ファイルの読み込みに失敗しました";
      setLoadError(msg.includes("\n") ? `読み込みエラー\n${msg}` : msg);
    }
  }, []);

  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    const next = data.map((r) => [...r]);
    if (!next[rowIndex]) return;
    while (next[rowIndex].length <= colIndex) next[rowIndex].push("");
    next[rowIndex][colIndex] = value;
    pushState(next, columnOrder);
  }, [data, columnOrder, pushState]);

  const addRow = useCallback(() => {
    const colCount = data[0]?.length ?? 1;
    const newRow = Array.from({ length: colCount }, () => "");
    pushState([...data, newRow], columnOrder);
  }, [data, columnOrder, pushState]);

  const addColumn = useCallback(() => {
    const newData = data.map((row) => [...row, ""]);
    const newColumnOrder = [...columnOrder, columnOrder.length];
    pushState(newData, newColumnOrder);
  }, [data, columnOrder, pushState]);

  const deleteRow = useCallback((rowIndex: number) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    pushState(newData, columnOrder);
  }, [data, columnOrder, pushState]);

  const deleteColumn = useCallback((displayColIndex: number) => {
    const actualCol = columnOrder[displayColIndex];
    if (actualCol == null) return;
    const newData = data.map((row) => row.filter((_, i) => i !== actualCol));
    const newColumnOrder = columnOrder
      .filter((i) => i !== actualCol)
      .map((i) => (i > actualCol ? i - 1 : i));
    pushState(newData, newColumnOrder);
  }, [data, columnOrder, pushState]);

  const clearRow = useCallback((rowIndex: number) => {
    const next = data.map((r) => [...r]);
    if (!next[rowIndex]) return;
    next[rowIndex] = Array.from({ length: next[rowIndex].length }, () => "");
    pushState(next, columnOrder);
  }, [data, columnOrder, pushState]);

  const clearColumn = useCallback((displayColIndex: number) => {
    const actualCol = columnOrder[displayColIndex];
    if (actualCol == null) return;
    const newData = data.map((row) => {
      const r = [...row];
      if (actualCol < r.length) r[actualCol] = "";
      return r;
    });
    pushState(newData, columnOrder);
  }, [data, columnOrder, pushState]);

  const reorderColumns = useCallback((newOrder: number[]) => {
    pushState(data, newOrder);
  }, [data, pushState]);

  const setExportOptions = useCallback(
    (updates: Partial<CsvOptions>) => {
      setOptions((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const clearData = useCallback(() => {
    setHistory([{ data: [], columnOrder: [] }]);
    setHistoryIndex(0);
    setLoadError(null);
  }, []);

  const createNew = useCallback((rows = 1, cols = 4) => {
    setLoadError(null);
    const newData = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "")
    );
    const newColumnOrder = Array.from({ length: cols }, (_, i) => i);
    setHistory([{ data: newData, columnOrder: newColumnOrder }]);
    setHistoryIndex(0);
    setOptions({
      charset: "UTF-8",
      delimiter: ",",
      quoteChar: '"',
      lineEnding: "LF",
    });
  }, []);

  const columnCount = data[0]?.length ?? 0;

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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    loadError,
    columnCount,
    rowCount: data.length,
  };
}
