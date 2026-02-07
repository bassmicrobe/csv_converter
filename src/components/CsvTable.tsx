"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useToast } from "@/components/Toast";
import type { CsvOptions } from "@/lib/types";

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const COL_WIDTH = 120;
const COL_MIN_WIDTH = 60;
const COL_MAX_WIDTH = 400;

export type SortDirection = "asc" | "desc" | null;

interface CsvTableProps {
  data: string[][];
  filteredIndices: number[] | null;
  columnOrder: number[];
  hasHeaderRow?: boolean;
  sortColumn: number | null;
  sortDirection: SortDirection;
  onSortChange: (column: number | null, direction: SortDirection) => void;
  onColumnOrderChange?: (order: number[]) => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onDeleteRow?: (rowIndex: number) => void;
  onDeleteColumn?: (displayColIndex: number) => void;
  onClearRow?: (rowIndex: number) => void;
  onClearColumn?: (displayColIndex: number) => void;
  options: CsvOptions;
  searchColumn: number | null;
  onUpdateCell: (rowIndex: number, colIndex: number, value: string) => void;
}

const ROW_ACTION_WIDTH = 72;

export function CsvTable({
  data,
  filteredIndices,
  columnOrder,
  hasHeaderRow = false,
  sortColumn,
  sortDirection,
  onSortChange,
  onColumnOrderChange,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  onClearRow,
  onClearColumn,
  options,
  searchColumn,
  onUpdateCell,
}: CsvTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const getColumnWidth = useCallback(
    (displayColIndex: number) => {
      const actualCol = columnOrder[displayColIndex];
      return (actualCol != null && columnWidths[actualCol] != null)
        ? columnWidths[actualCol]
        : COL_WIDTH;
    },
    [columnOrder, columnWidths]
  );

  const handleResizeStart = useCallback(
    (displayColIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingCol(displayColIndex);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = getColumnWidth(displayColIndex);
    },
    [getColumnWidth]
  );

  useEffect(() => {
    if (resizingCol == null) return;
    const actualCol = columnOrder[resizingCol];
    if (actualCol == null) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.min(
        COL_MAX_WIDTH,
        Math.max(COL_MIN_WIDTH, resizeStartWidth.current + delta)
      );
      setColumnWidths((prev) => ({ ...prev, [actualCol]: newWidth }));
    };
    const onUp = () => setResizingCol(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingCol, columnOrder]);

  const dataRowIndices = useMemo(() => {
    const start = hasHeaderRow ? 1 : 0;
    if (!filteredIndices) {
      return Array.from({ length: data.length - start }, (_, i) => start + i);
    }
    return filteredIndices;
  }, [data.length, filteredIndices, hasHeaderRow]);

  const sortedIndices = useMemo(() => {
    if (sortColumn == null || !sortDirection) return dataRowIndices;
    const actualSortCol = columnOrder[sortColumn] ?? sortColumn;
    const sorted = [...dataRowIndices].sort((a, b) => {
      const va = (data[a]?.[actualSortCol] ?? "").toLowerCase();
      const vb = (data[b]?.[actualSortCol] ?? "").toLowerCase();
      const cmp = va.localeCompare(vb, "ja");
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [dataRowIndices, data, sortColumn, sortDirection, columnOrder]);

  const rows = useMemo(
    () => sortedIndices.map((i) => data[i]),
    [sortedIndices, data]
  );
  const colCount = columnOrder.length;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const getActualRowIndex = useCallback(
    (virtualIndex: number) => sortedIndices[virtualIndex],
    [sortedIndices]
  );

  const handleSortClick = useCallback(
    (colIndex: number) => {
      const next: SortDirection =
        sortColumn === colIndex
          ? sortDirection === "asc"
            ? "desc"
            : sortDirection === "desc"
              ? null
              : "asc"
          : "asc";
      onSortChange(next ? colIndex : null, next);
    },
    [sortColumn, sortDirection, onSortChange]
  );

  const handleCellChange = useCallback(
    (virtualRowIndex: number, displayColIndex: number, value: string) => {
      const actualRowIndex = getActualRowIndex(virtualRowIndex);
      const actualColIndex = columnOrder[displayColIndex] ?? displayColIndex;
      onUpdateCell(actualRowIndex, actualColIndex, value);
    },
    [getActualRowIndex, columnOrder, onUpdateCell]
  );

  const handleColumnDragStart = useCallback(
    (e: React.DragEvent, displayColIndex: number) => {
      e.dataTransfer.setData("text/plain", String(displayColIndex));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleColumnDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleColumnDrop = useCallback(
    (e: React.DragEvent, dropDisplayIndex: number) => {
      e.preventDefault();
      const dragIndex = Number(e.dataTransfer.getData("text/plain"));
      if (Number.isNaN(dragIndex) || dragIndex === dropDisplayIndex) return;
      const newOrder = [...columnOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropDisplayIndex, 0, removed);
      onColumnOrderChange?.(newOrder);
    },
    [columnOrder, onColumnOrderChange]
  );

  const headerRow = hasHeaderRow && data[0] ? data[0] : null;

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-100 text-stone-500">
        CSVを読み込んでください
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();

  const hasRowActions = onAddRow != null || onDeleteRow != null || onClearRow != null;
  const hasColActions = onDeleteColumn != null || onClearColumn != null;
  const tableMinWidth =
    (hasRowActions ? ROW_ACTION_WIDTH : 0) +
    columnOrder.reduce((sum, _, i) => sum + getColumnWidth(i), 0);

  return (
    <div
      ref={parentRef}
      className="h-[min(70vh,600px)] overflow-auto rounded-xl border border-stone-200 bg-white shadow-sm"
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize() + HEADER_HEIGHT,
          minWidth: tableMinWidth,
        }}
        className="relative"
      >
        {/* ヘッダー行（表題行または Col 1, Col 2...） */}
        <div
          className="sticky top-0 z-10 flex border-b border-stone-200 bg-stone-100"
          style={{ height: HEADER_HEIGHT }}
        >
          {hasRowActions && (
            <div
              className="flex shrink-0 items-center justify-center gap-1 border-r border-stone-200 bg-stone-100"
              style={{ width: ROW_ACTION_WIDTH }}
            >
              {onAddRow && (
                <button
                  type="button"
                  onClick={onAddRow}
                  className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100"
                  title="行を追加"
                >
                  +行
                </button>
              )}
            </div>
          )}
          {columnOrder.map((actualColIndex, displayColIndex) => {
            const label = headerRow?.[actualColIndex]
              ? `${headerRow[actualColIndex]}${searchColumn === displayColIndex ? " (絞込)" : ""}`
              : `Col ${displayColIndex + 1}${searchColumn === displayColIndex ? " (絞込)" : ""}`;
            const isSorted = sortColumn === displayColIndex;
            const w = getColumnWidth(displayColIndex);
            return (
              <div
                key={displayColIndex}
                onDragOver={handleColumnDragOver}
                onDrop={(e) => handleColumnDrop(e, displayColIndex)}
                className="group/col relative flex shrink-0 items-center gap-0.5 border-r border-stone-200 last:border-r-0"
                style={{ width: w }}
              >
                {onColumnOrderChange && (
                  <span
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, displayColIndex)}
                    className="cursor-grab touch-none select-none px-1 py-0.5 text-stone-400 hover:text-stone-600 active:cursor-grabbing"
                    title="ドラッグで列の並び順を変更"
                  >
                    ⋮⋮
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSortClick(displayColIndex)}
                  className="flex flex-1 cursor-pointer items-center gap-1 px-2 py-0 text-left hover:bg-stone-200/50"
                >
                  <span className="truncate text-xs font-medium text-emerald-700">
                    {label}
                  </span>
                  {isSorted && sortDirection && (
                    <span className="text-emerald-600">
                      {sortDirection === "asc" ? " ↑" : " ↓"}
                    </span>
                  )}
                  {!isSorted && (
                    <span className="text-stone-400" title="クリックでソート">⇅</span>
                  )}
                </button>
                {hasColActions && (
                  <div className="flex shrink-0 gap-0.5">
                    {onClearColumn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearColumn(displayColIndex);
                          toast?.show("列の内容を空にしました");
                        }}
                        className="cursor-pointer rounded p-1 text-stone-400 hover:bg-emerald-100 hover:text-emerald-600"
                        title={`列 ${displayColIndex + 1} の内容を空にする`}
                      >
                        ⌫
                      </button>
                    )}
                    {onDeleteColumn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteColumn(displayColIndex);
                          toast?.show("列を削除しました");
                        }}
                        className="cursor-pointer rounded p-1 text-stone-400 hover:bg-red-100 hover:text-red-600"
                        title={`列 ${displayColIndex + 1} を削除`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                <div
                  onMouseDown={(e) => handleResizeStart(displayColIndex, e)}
                  className="absolute -right-1 top-0 z-20 h-full w-3 cursor-col-resize"
                  title="ドラッグで列の幅を変更"
                  role="separator"
                  aria-orientation="vertical"
                />
              </div>
            );
          })}
          {onAddColumn && (
            <button
              type="button"
              onClick={onAddColumn}
              className="cursor-pointer flex shrink-0 items-center justify-center border-l border-dashed border-stone-300 px-3 text-stone-400 hover:bg-stone-100 hover:text-emerald-600"
              title="列を追加"
            >
              +列
            </button>
          )}
        </div>

        {/* 仮想スクロール行 */}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index] ?? [];
          const actualRowIndex = getActualRowIndex(virtualRow.index);
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 flex w-full border-b border-stone-100 hover:bg-stone-50"
              style={{
                height: ROW_HEIGHT,
                top: HEADER_HEIGHT + virtualRow.start,
              }}
            >
              {hasRowActions && (
                <div
                  className="flex shrink-0 items-center justify-center gap-1 border-r border-stone-200 group"
                  style={{ width: ROW_ACTION_WIDTH }}
                >
                  <span className="text-xs text-stone-400">
                    {actualRowIndex + 1}
                  </span>
                  {onClearRow && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearRow(actualRowIndex);
                        toast?.show("行の内容を空にしました");
                      }}
                      className="cursor-pointer rounded p-0.5 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 hover:text-emerald-600"
                      title={`行 ${actualRowIndex + 1} の内容を空にする`}
                    >
                      ⌫
                    </button>
                  )}
                  {onDeleteRow && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRow(actualRowIndex);
                        toast?.show("行を削除しました");
                      }}
                      className="cursor-pointer rounded p-0.5 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                      title={`行 ${actualRowIndex + 1} を削除`}
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
              {columnOrder.map((actualColIndex, displayColIndex) => (
                <EditableCell
                  key={displayColIndex}
                  value={row[actualColIndex] ?? ""}
                  onBlur={(value) =>
                    handleCellChange(virtualRow.index, displayColIndex, value)
                  }
                  onEditComplete={() => toast?.show("編集しました")}
                  width={getColumnWidth(displayColIndex)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditableCell({
  value,
  onBlur,
  onEditComplete,
  width,
}: {
  value: string;
  onBlur: (value: string) => void;
  onEditComplete?: () => void;
  width: number;
}) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (local !== value) {
      onBlur(local);
      onEditComplete?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  if (editing) {
    return (
      <div
        className="shrink-0 border-r border-stone-200 px-2 py-1 last:border-r-0"
        style={{ width }}
      >
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-full w-full rounded border border-emerald-500/50 bg-white px-2 py-1 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="flex shrink-0 cursor-text items-center overflow-hidden border-r border-stone-200 px-2 py-1 last:border-r-0"
      style={{ width }}
      title={value}
    >
      <span className="block truncate text-sm text-stone-900">{value || "\u00A0"}</span>
    </div>
  );
}

