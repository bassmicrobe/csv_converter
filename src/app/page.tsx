"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CsvTable } from "@/components/CsvTable";
import { ExportPanel } from "@/components/ExportPanel";
import { FileLoader } from "@/components/FileLoader";
import { Modal } from "@/components/Modal";
import { SearchFilter } from "@/components/SearchFilter";
import { useToast } from "@/components/Toast";
import { useCsvEditor } from "@/hooks/useCsvEditor";

const QRGenerator = dynamic(
  () => import("@/components/QRGenerator").then((module) => module.QRGenerator),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-sm text-stone-600">
        QRコード生成機能を読み込み中...
      </p>
    ),
  },
);

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
    clearRow,
    clearColumn,
    reorderColumns,
    setExportOptions,
    createNew,
    undo,
    redo,
    canUndo,
    canRedo,
    loadError,
    columnCount,
    rowCount,
  } = useCsvEditor();

  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, [role='textbox'], dialog"))
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) {
            redo();
            toast?.show("やり直しました");
          }
        } else {
          if (canUndo) {
            undo();
            toast?.show("元に戻しました");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo, toast]);

  const [filteredIndices, setFilteredIndices] = useState<number[] | null>(null);
  const [searchColumn, setSearchColumn] = useState<number | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState(false);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleFilterChange = useCallback(
    (indices: number[] | null, column: number | null) => {
      setFilteredIndices(indices);
      setSearchColumn(column);
    },
    [],
  );

  const hasData = data.length > 0 && columnOrder.length > 0;
  const hasEditor =
    data.length > 0 || columnOrder.length > 0 || canUndo || canRedo;

  return (
    <main
      className="mx-auto max-w-[1600px] px-4 py-8 md:px-6"
      aria-label="メインコンテンツ"
    >
      <header className="mb-10">
        <h1>
          <BrandLogo className="h-24 w-auto" />
        </h1>
        <p className="mt-1 text-stone-600">
          無料のオンラインCSV編集ツール - ブラウザだけで安全に編集
        </p>
        <div className="mt-4 rounded-lg border-2 border-emerald-500/60 bg-emerald-50 px-4 py-3">
          <p className="text-lg font-bold text-emerald-700">
            CSVデータはサーバーに送信されません
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            CSVの読み込み・編集・出力はブラウザ内で完結し、CSVデータをLocalStorage等に自動保存しません。
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            お問い合わせ送信・同意した場合のアクセス解析には外部通信を利用します。
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

        {hasEditor && (
          <>
            <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={hasHeaderRow}
                  onChange={(e) => setHasHeaderRow(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                {(hasHeaderRow
                  ? Math.max(0, rowCount - 1)
                  : rowCount
                ).toLocaleString()}{" "}
                行（データ） × {columnCount} 列
                {rowCount >= 50_000 && (
                  <span className="ml-2 text-red-500">
                    （上限に達しています）
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    undo();
                    toast?.show("元に戻しました");
                  }}
                  disabled={!canUndo}
                  className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="元に戻す (Ctrl+Z)"
                >
                  元に戻す
                </button>
                <button
                  type="button"
                  onClick={() => {
                    redo();
                    toast?.show("やり直しました");
                  }}
                  disabled={!canRedo}
                  className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="やり直す (Ctrl+Shift+Z)"
                >
                  やり直す
                </button>
              </div>
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
              onClearRow={clearRow}
              onClearColumn={clearColumn}
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

        <section
          className="mt-12 rounded-xl border border-stone-200 bg-white p-6"
          aria-labelledby="about-heading"
        >
          <h2
            id="about-heading"
            className="mb-4 text-lg font-semibold text-stone-900"
          >
            ezcsvとは
          </h2>
          <p className="mb-4 text-stone-600">
            ezcsvは無料のオンラインCSV編集ツールです。ブラウザ上でCSV・TSVファイルを編集・変換でき、インストール不要で即座に利用できます。データは一切サーバーに送信されず、すべてブラウザ内で処理されるため、個人情報や機密データも安全に編集できます。UTF-8/Shift_JIS対応、最大5万行まで、検索・ソート・列の並び替え・PDF出力・QRコード生成などの機能を備えています。
          </p>
          <h3 className="mb-2 text-base font-medium text-stone-800">
            よくある質問
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="font-medium text-stone-800">
                ezcsvは無料で使えますか？
              </dt>
              <dd className="mt-1 text-sm text-stone-600">
                はい、完全無料です。登録やログインは不要です。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">
                CSVデータはサーバーに送信されますか？
              </dt>
              <dd className="mt-1 text-sm text-stone-600">
                いいえ、CSVの読み込み・編集・出力はブラウザ内で完結し、CSVデータを外部に送信しません。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">
                どのような形式のCSVに対応していますか？
              </dt>
              <dd className="mt-1 text-sm text-stone-600">
                UTF-8・Shift_JIS、カンマ・タブ区切り、LF/CRLF改行に対応しています。読み込み時に自動判別されます。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">
                Excelで開けるCSVを出力できますか？
              </dt>
              <dd className="mt-1 text-sm text-stone-600">
                はい、UTF-8またはShift_JISでエクスポートできます。Excelで開く場合はShift_JISを選択してください。
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
