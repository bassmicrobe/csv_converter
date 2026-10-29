"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterRowIndices } from "@/lib/csvView";

interface SearchFilterProps {
  data: string[][];
  columnCount: number;
  columnOrder?: number[];
  hasHeaderRow?: boolean;
  onFilterChange: (indices: number[] | null, column: number | null) => void;
  disabled?: boolean;
}

export function SearchFilter({
  data,
  columnCount,
  columnOrder,
  hasHeaderRow = false,
  onFilterChange,
  disabled,
}: SearchFilterProps) {
  const [searchColumn, setSearchColumn] = useState<number>(0);
  const [searchText, setSearchText] = useState("");

  const searchStartRow = hasHeaderRow ? 1 : 0;
  const selectedColumn = Math.min(searchColumn, Math.max(0, columnCount - 1));

  const actualSearchCol = columnOrder
    ? (columnOrder[selectedColumn] ?? selectedColumn)
    : selectedColumn;

  const filteredIndices = useMemo(() => {
    const col = Math.min(actualSearchCol, columnCount - 1);
    return filterRowIndices(data, col, searchText, searchStartRow);
  }, [data, actualSearchCol, searchText, columnCount, searchStartRow]);

  const headerLabels = useMemo(() => {
    if (!hasHeaderRow || !data[0]) return null;
    return data[0];
  }, [hasHeaderRow, data]);

  const handleColumnChange = useCallback((col: number) => {
    setSearchColumn(col);
    // searchText はそのまま、filteredIndices は useMemo で再計算される
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  useEffect(() => {
    const col = searchText.trim() ? selectedColumn : null;
    onFilterChange(filteredIndices, col);
  }, [filteredIndices, selectedColumn, searchText, onFilterChange]);

  if (columnCount === 0) return null;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700">
        検索・フィルタ
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label
            htmlFor="search-filter-column"
            className="mb-1 block text-xs text-stone-600"
          >
            カラム
          </label>
          <select
            id="search-filter-column"
            value={selectedColumn}
            onChange={(e) => handleColumnChange(Number(e.target.value))}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Array.from({ length: columnCount }).map((_, i) => {
              const actualCol = columnOrder?.[i] ?? i;
              const label = headerLabels?.[actualCol];
              return (
                <option key={actualCol} value={i}>
                  {label ? `${label} (Col${i + 1})` : `Col ${i + 1}`}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="search-filter-query"
            className="mb-1 block text-xs text-stone-600"
          >
            検索文字列
          </label>
          <input
            id="search-filter-query"
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="検索..."
            disabled={disabled}
            className="w-full cursor-text rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {filteredIndices !== null && (
          <p className="text-sm text-stone-600">
            {filteredIndices.length} 件表示（全{" "}
            {Math.max(0, data.length - searchStartRow)} 件中）
          </p>
        )}
      </div>
    </section>
  );
}
