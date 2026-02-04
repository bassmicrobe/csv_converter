"use client";

import { useCallback, useState } from "react";
import { detectAndReadCsv } from "@/lib/csvDetect";
import { parseCsv } from "@/lib/csvParser";
import type { CsvOptions } from "@/lib/types";

const MAX_ROWS = 50_000;

export function useCsvEditor() {
  const [data, setData] = useState<string[][]>([]);
  const [options, setOptions] = useState<CsvOptions>({
    charset: "UTF-8",
    delimiter: ",",
    quoteChar: '"',
    lineEnding: "LF",
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<number[]>([]);

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

      setData(result.data);
      setOptions(detectedOptions);
      const cols = result.data[0]?.length ?? 0;
      setColumnOrder(Array.from({ length: cols }, (_, i) => i));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ファイルの読み込みに失敗しました";
      setLoadError(msg.includes("\n") ? `読み込みエラー\n${msg}` : msg);
    }
  }, []);

  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setData((prev) => {
      const next = prev.map((r) => [...r]);
      if (!next[rowIndex]) return prev;
      while (next[rowIndex].length <= colIndex) {
        next[rowIndex].push("");
      }
      next[rowIndex][colIndex] = value;
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setData((prev) => {
      const colCount = prev[0]?.length ?? 1;
      const newRow = Array.from({ length: colCount }, () => "");
      return [...prev, newRow];
    });
  }, []);

  const addColumn = useCallback(() => {
    setData((prev) => prev.map((row) => [...row, ""]));
    setColumnOrder((prev) => [...prev, prev.length]);
  }, []);

  const deleteRow = useCallback((rowIndex: number) => {
    setData((prev) => prev.filter((_, i) => i !== rowIndex));
  }, []);

  const deleteColumn = useCallback((displayColIndex: number) => {
    setColumnOrder((prev) => {
      const actualCol = prev[displayColIndex];
      if (actualCol == null) return prev;
      setData((d) =>
        d.map((row) => row.filter((_, i) => i !== actualCol))
      );
      return prev
        .filter((i) => i !== actualCol)
        .map((i) => (i > actualCol ? i - 1 : i));
    });
  }, []);

  const reorderColumns = useCallback((newOrder: number[]) => {
    setColumnOrder(newOrder);
  }, []);

  const setExportOptions = useCallback(
    (updates: Partial<CsvOptions>) => {
      setOptions((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const clearData = useCallback(() => {
    setData([]);
    setLoadError(null);
    setColumnOrder([]);
  }, []);

  const createNew = useCallback((rows = 1, cols = 4) => {
    setLoadError(null);
    const newData = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "")
    );
    setData(newData);
    setOptions({
      charset: "UTF-8",
      delimiter: ",",
      quoteChar: '"',
      lineEnding: "LF",
    });
    setColumnOrder(Array.from({ length: cols }, (_, i) => i));
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
    reorderColumns,
    setExportOptions,
    clearData,
    createNew,
    loadError,
    columnCount,
    rowCount: data.length,
  };
}
