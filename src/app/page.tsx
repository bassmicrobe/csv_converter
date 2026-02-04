"use client";

import { useState, useCallback } from "react";
import { FileLoader } from "@/components/FileLoader";
import { SearchFilter } from "@/components/SearchFilter";
import { CsvTable } from "@/components/CsvTable";
import { ExportPanel } from "@/components/ExportPanel";
import { Modal } from "@/components/Modal";
import { QRGenerator } from "@/components/QRGenerator";
import { useCsvEditor } from "@/hooks/useCsvEditor";

export default function Home() {
  const {
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
    createNew,
    loadError,
    columnCount,
    rowCount,
  } = useCsvEditor();

  const [filteredIndices, setFilteredIndices] = useState<number[] | null>(null);
  const [searchColumn, setSearchColumn] = useState<number | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState(false);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleFilterChange = useCallback(
    (indices: number[] | null, column: number | null) => {
      setFilteredIndices(indices);
      setSearchColumn(column);
    },
    []
  );

  const hasData = data.length > 0;

  return (
    <main
      className="mx-auto max-w-[1600px] px-4 py-8 md:px-6"
      aria-label="メインコンテンツ"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          ezcsv
        </h1>
        <p className="mt-1 text-stone-600">
          ブラウザだけで動くCSV編集ツール
        </p>
        <div className="mt-4 rounded-lg border-2 border-emerald-500/60 bg-emerald-50 px-4 py-3">
          <p className="text-lg font-bold text-emerald-700">
            データはサーバーに送信されません
          </p>
          <p className="mt-1 text-sm text-emerald-600">
            すべての処理はブラウザ内で完結・外部への通信なし・LocalStorage等への保存も行いません
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <FileLoader
          onLoad={loadFile}
          onCreateNew={() => {
            createNew(1, 4);
            setHasHeaderRow(false);
            setFilteredIndices(null);
            setSearchColumn(null);
            setSortColumn(null);
            setSortDirection(null);
          }}
          loadError={loadError}
          disabled={false}
        />

        {hasData && (
          <>
            <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={hasHeaderRow}
                  onChange={(e) => setHasHeaderRow(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="block font-medium text-stone-800">
                    1行目を表題行（ヘッダー）として扱う
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    ONにすると、1行目が列名として画面上部に固定され、検索・フィルタの対象から除外されます。表題行を編集する際は一度OFFにしてください。
                  </span>
                </div>
              </label>
            </div>

            <SearchFilter
              data={data}
              columnCount={columnCount}
              columnOrder={columnOrder}
              hasHeaderRow={hasHeaderRow}
              onFilterChange={handleFilterChange}
              disabled={false}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-600">
                {(hasHeaderRow ? Math.max(0, rowCount - 1) : rowCount).toLocaleString()} 行（データ）
                × {columnCount} 列
                {rowCount >= 50_000 && (
                  <span className="ml-2 text-amber-500">
                    （上限に達しています）
                  </span>
                )}
              </p>
            </div>

            <CsvTable
              data={data}
              filteredIndices={filteredIndices}
              columnOrder={columnOrder}
              hasHeaderRow={hasHeaderRow}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSortChange={(col, dir) => {
                setSortColumn(col);
                setSortDirection(dir);
              }}
              onColumnOrderChange={reorderColumns}
              onAddRow={addRow}
              onAddColumn={addColumn}
              onDeleteRow={deleteRow}
              onDeleteColumn={deleteColumn}
              options={options}
              searchColumn={searchColumn}
              onUpdateCell={updateCell}
            />

            <ExportPanel
              data={data}
              columnOrder={columnOrder}
              options={options}
              onOptionsChange={setExportOptions}
              disabled={!hasData}
            />

            <div>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                disabled={!hasData}
                className="cursor-pointer rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                QRコード生成
              </button>
            </div>

            <Modal
              isOpen={qrModalOpen}
              onClose={() => setQrModalOpen(false)}
              title="QRコード生成"
            >
              <QRGenerator
                data={data}
                columnOrder={columnOrder}
                hasHeaderRow={hasHeaderRow}
                filteredIndices={filteredIndices}
                disabled={!hasData}
                inModal
              />
            </Modal>
          </>
        )}
      </div>

    </main>
  );
}
