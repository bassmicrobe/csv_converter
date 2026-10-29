"use client";

import JSZip from "jszip";
import Image from "next/image";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { MAX_QR, selectQrRows } from "./qrRows";

const HEX_COLOR = /^#[\da-f]{6}$/i;
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface QRGeneratorProps {
  data: string[][];
  columnOrder?: number[];
  hasHeaderRow?: boolean;
  filteredIndices?: number[] | null;
  disabled?: boolean;
  inModal?: boolean;
}

export function QRGenerator({
  data,
  columnOrder,
  hasHeaderRow = false,
  filteredIndices = null,
  disabled,
  inModal = false,
}: QRGeneratorProps) {
  const columnCount = columnOrder?.length ?? data[0]?.length ?? 0;
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(
    new Set([0]),
  );
  const [size, setSize] = useState(200);
  const [separator, setSeparator] = useState("\n");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] =
    useState<ErrorCorrectionLevel>("M");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"qr" | "zip" | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const generationId = useRef(0);
  const uid = useId();
  const validColors = HEX_COLOR.test(fgColor) && HEX_COLOR.test(bgColor);

  const { rows: dataRows, totalRows: totalRowsBeforeLimit } = useMemo(
    () => selectQrRows(data, hasHeaderRow, filteredIndices),
    [data, hasHeaderRow, filteredIndices],
  );

  useEffect(
    () => () => {
      generationId.current++;
    },
    [],
  );

  const headerLabels = useMemo(() => {
    if (!hasHeaderRow || !data[0]) return null;
    return data[0];
  }, [hasHeaderRow, data]);

  const getRowText = useCallback(
    (row: string[]) => {
      const ordered = Array.from(selectedColumns).sort((a, b) => a - b);
      return ordered
        .map((displayIdx) => {
          const actualCol = columnOrder?.[displayIdx] ?? displayIdx;
          return row[actualCol] ?? "";
        })
        .join(separator);
    },
    [selectedColumns, columnOrder, separator],
  );

  const toggleColumn = useCallback((displayIdx: number) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(displayIdx)) {
        next.delete(displayIdx);
      } else {
        next.add(displayIdx);
      }
      return next;
    });
  }, []);

  const previewText = useMemo(() => {
    if (dataRows.length === 0) return "";
    return getRowText(dataRows[0]);
  }, [dataRows, getRowText]);

  const qrOptions = useMemo(
    () => ({
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      type: "image/png" as const,
      errorCorrectionLevel: errorCorrection,
    }),
    [size, fgColor, bgColor, errorCorrection],
  );

  useEffect(() => {
    let cancelled = false;
    setPreviewDataUrl(null);
    setPreviewLoading(false);
    if (!validColors) {
      setPreviewError("色は #000000 のような6桁の16進数で入力してください。");
      return;
    }
    if (selectedColumns.size === 0 || previewText === "") {
      setPreviewError(null);
      return;
    }
    setPreviewError(null);
    setPreviewLoading(true);
    QRCode.toDataURL(previewText, {
      ...qrOptions,
      width: Math.min(size, 512),
    })
      .then((url) => {
        if (!cancelled) setPreviewDataUrl(url);
      })
      .catch(() => {
        if (!cancelled)
          setPreviewError(
            "QRコードを生成できません。含める列や文字数を減らすか、誤り訂正レベルを下げてください。",
          );
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [previewText, size, selectedColumns.size, qrOptions, validColors]);

  const handleGenerate = useCallback(async () => {
    if (
      !validColors ||
      generating ||
      selectedColumns.size === 0 ||
      dataRows.length === 0
    )
      return;
    const runId = ++generationId.current;
    const isCurrent = () => generationId.current === runId;
    setGenerationError(null);
    setGenerating(true);
    setProgress(0);
    setPhase("qr");
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );

    try {
      const zip = new JSZip();
      const total = dataRows.length;
      let done = 0;
      let generated = 0;
      let singleDataUrl: string | null = null;

      for (let i = 0; i < total; i++) {
        if (!isCurrent()) return;
        if (i % 10 === 0)
          await new Promise((resolve) => requestAnimationFrame(resolve));
        if (!isCurrent()) return;
        const row = dataRows[i];
        const text = getRowText(row);
        if (!text.trim()) {
          done++;
          setProgress(Math.round((done / total) * 100));
          continue;
        }
        const dataUrl = await QRCode.toDataURL(text, qrOptions);
        if (!isCurrent()) return;
        singleDataUrl = dataUrl;
        generated++;
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const filename = `qr_${String(i + 1).padStart(String(total).length, "0")}.png`;
        zip.file(filename, base64, { base64: true });
        done++;
        setProgress(Math.round((done / total) * 100));
      }

      if (generated === 0) {
        setGenerationError(
          "選択した列のデータがすべて空です。列や対象行を確認してください。",
        );
        return;
      }
      if (total === 1 && singleDataUrl) {
        const a = document.createElement("a");
        a.href = singleDataUrl;
        a.download = "qr_01.png";
        a.click();
      } else {
        setPhase("zip");
        setProgress(0);
        await new Promise((r) => requestAnimationFrame(r));
        const zipBlob = await zip.generateAsync(
          { type: "blob" },
          ({ percent }) => {
            if (isCurrent()) setProgress(Math.round(percent));
          },
        );
        if (!isCurrent()) return;
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr_codes_${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      if (isCurrent())
        setGenerationError(
          "QRコードを生成できませんでした。含める列や文字数を減らすか、誤り訂正レベルを下げて再度お試しください。",
        );
    } finally {
      if (isCurrent()) {
        setGenerating(false);
        setProgress(0);
        setPhase(null);
      }
    }
  }, [
    selectedColumns.size,
    dataRows,
    getRowText,
    qrOptions,
    validColors,
    generating,
  ]);

  if (columnCount === 0) return null;

  const content = (
    <div className="flex flex-col gap-6">
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="mb-2 block text-xs font-medium text-stone-600">
          含める列を選択
        </legend>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: columnCount }).map((_, i) => {
            const actualCol = columnOrder?.[i] ?? i;
            const label = headerLabels?.[actualCol];
            const colLabel = label ? `${label} (Col${i + 1})` : `Col ${i + 1}`;
            return (
              <label
                key={actualCol}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.has(i)}
                  onChange={() => toggleColumn(i)}
                  disabled={disabled || generating}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-stone-800">{colLabel}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor={`${uid}-qr-size`}
            className="mb-1 block text-xs text-stone-600"
          >
            サイズ (px)
          </label>
          <input
            id={`${uid}-qr-size`}
            type="number"
            min={100}
            max={800}
            step={20}
            value={size}
            onChange={(e) =>
              setSize(
                Math.min(800, Math.max(100, Number(e.target.value) || 200)),
              )
            }
            disabled={disabled || generating}
            className="w-24 cursor-text rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor={`${uid}-qr-ec`}
            className="mb-1 block text-xs text-stone-600"
          >
            誤り訂正レベル
          </label>
          <select
            id={`${uid}-qr-ec`}
            value={errorCorrection}
            onChange={(e) =>
              setErrorCorrection(e.target.value as ErrorCorrectionLevel)
            }
            disabled={disabled || generating}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="L">L（約7%復元可能）</option>
            <option value="M">M（約15%復元可能）</option>
            <option value="Q">Q（約25%復元可能）</option>
            <option value="H">H（約30%復元可能）</option>
          </select>
        </div>
        <div>
          <label
            htmlFor={`${uid}-qr-sep`}
            className="mb-1 block text-xs text-stone-600"
          >
            列の区切り文字
          </label>
          <select
            id={`${uid}-qr-sep`}
            value={
              separator === "\n"
                ? "newline"
                : separator === "\t"
                  ? "tab"
                  : "comma"
            }
            onChange={(e) => {
              const v = e.target.value;
              setSeparator(v === "newline" ? "\n" : v === "tab" ? "\t" : ",");
            }}
            disabled={disabled || generating}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="newline">改行</option>
            <option value="tab">タブ</option>
            <option value="comma">カンマ</option>
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 block text-xs font-medium text-stone-600">
          色（PNG出力・白黒推奨）
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor={`${uid}-qr-fg-color`}
              className="mb-1 block text-xs text-stone-500"
            >
              前景（モジュール色）
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`${uid}-qr-fg-color`}
                type="color"
                value={HEX_COLOR.test(fgColor) ? fgColor : "#000000"}
                onChange={(e) => setFgColor(e.target.value)}
                disabled={disabled || generating}
                className="h-9 w-14 cursor-pointer rounded border border-stone-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <input
                id={`${uid}-qr-fg-hex`}
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                disabled={disabled || generating}
                aria-label="前景色（16進）"
                aria-invalid={!HEX_COLOR.test(fgColor)}
                className="w-20 cursor-text rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor={`${uid}-qr-bg-color`}
              className="mb-1 block text-xs text-stone-500"
            >
              背景
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`${uid}-qr-bg-color`}
                type="color"
                value={HEX_COLOR.test(bgColor) ? bgColor : "#ffffff"}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={disabled || generating}
                className="h-9 w-14 cursor-pointer rounded border border-stone-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <input
                id={`${uid}-qr-bg-hex`}
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={disabled || generating}
                aria-label="背景色（16進）"
                aria-invalid={!HEX_COLOR.test(bgColor)}
                className="w-20 cursor-text rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {totalRowsBeforeLimit > MAX_QR && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          対象が{totalRowsBeforeLimit.toLocaleString()}件のため、先頭
          {MAX_QR.toLocaleString()}件のみ生成します。
        </p>
      )}

      <div>
        <p
          id={`${uid}-qr-preview-heading`}
          className="mb-2 block text-xs font-medium text-stone-600"
        >
          プレビュー（1行目のみ）
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
            {previewError ? (
              <p role="alert" className="text-sm text-red-700">
                {previewError}
              </p>
            ) : previewLoading ? (
              <p role="status" className="text-sm text-stone-600">
                プレビューを生成中...
              </p>
            ) : previewDataUrl ? (
              <>
                <Image
                  src={previewDataUrl}
                  alt="QRプレビュー"
                  width={Math.min(size, 200)}
                  height={Math.min(size, 200)}
                  unoptimized
                  className="max-w-[200px] border border-stone-200"
                />
                <span className="text-xs text-stone-500">
                  {size}×{size}px で出力
                </span>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                {selectedColumns.size === 0
                  ? "列を1つ以上選択してください"
                  : "データがありません"}
              </p>
            )}
          </div>
          {previewText && (
            <div className="max-w-md rounded-lg border border-stone-200 bg-white p-3">
              <p className="mb-1 text-xs font-medium text-stone-500">
                プレビュー対象テキスト
              </p>
              <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all text-xs text-stone-700">
                {previewText || "（空）"}
              </pre>
            </div>
          )}
        </div>
      </div>

      {generating && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-stone-600">
            <span>{phase === "zip" ? "ZIP作成中..." : "QR生成中..."}</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={phase === "zip" ? "ZIP作成" : "QRコード生成"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 w-full overflow-hidden rounded-full bg-stone-200"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {generationError && (
        <p role="alert" className="text-sm text-red-700">
          {generationError}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={
          disabled ||
          selectedColumns.size === 0 ||
          dataRows.length === 0 ||
          !validColors ||
          generating
        }
        className="min-h-11 cursor-pointer self-start rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating
          ? "生成中..."
          : dataRows.length > 1
            ? "ZIPでダウンロード"
            : "PNGでダウンロード"}
      </button>
    </div>
  );

  if (inModal) return content;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700">
        QRコード生成
      </h2>
      {content}
    </section>
  );
}
