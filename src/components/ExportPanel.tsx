"use client";

import { useCallback, useState } from "react";
import { exportCsv } from "@/lib/csvExporter";
import { getPdfLimitError } from "@/lib/pdfExportLimits";
import type {
  Charset,
  CsvOptions,
  Delimiter,
  LineEnding,
  QuoteChar,
} from "@/lib/types";

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

interface ExportPanelProps {
  data: string[][];
  columnOrder?: number[];
  options: CsvOptions;
  onOptionsChange: (updates: Partial<CsvOptions>) => void;
  disabled?: boolean;
}

export function ExportPanel({
  data,
  columnOrder,
  options,
  onOptionsChange,
  disabled,
}: ExportPanelProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const pdfLimitError = getPdfLimitError(data, columnOrder);

  const handleExport = useCallback(async () => {
    if (!data.length || exportingCsv) return;
    setExportError(null);
    setExportingCsv(true);
    try {
      const exportData = columnOrder?.length
        ? data.map((row) => columnOrder.map((i) => row[i] ?? ""))
        : data;
      const csv = exportCsv(exportData, options);
      const raw =
        options.charset === "Shift_JIS"
          ? (await import("iconv-lite")).default.encode(csv, "shiftjis")
          : new TextEncoder().encode(csv);
      const mimeType =
        options.delimiter === "\t" ? "text/tab-separated-values" : "text/csv";
      const charset = options.charset === "Shift_JIS" ? "shift-jis" : "utf-8";
      const blob = new Blob([new Uint8Array(raw)], {
        type: `${mimeType};charset=${charset}`,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `export_${new Date().toISOString().slice(0, 10)}.${options.delimiter === "\t" ? "tsv" : "csv"}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(
        "ファイルを保存できませんでした。データ量を減らして再試行してください。",
      );
    } finally {
      setExportingCsv(false);
    }
  }, [data, columnOrder, options, exportingCsv]);

  const handleExportPdf = useCallback(async () => {
    if (!data.length || exportingPdf) return;
    setExportError(null);
    const limitError = getPdfLimitError(data, columnOrder);
    if (limitError) {
      setExportError(limitError);
      return;
    }
    setExportingPdf(true);
    let iframe: HTMLIFrameElement | null = null;
    try {
      const exportData = columnOrder?.length
        ? data.map((row) => columnOrder.map((i) => row[i] ?? ""))
        : data;

      const thead = exportData[0]
        .map((cell) => `<th>${escapeHtml(cell)}</th>`)
        .join("");
      const tbody = exportData
        .slice(1)
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("");

      const tableHtml = `
      <table style="border-collapse: collapse; table-layout: fixed; width: 1120px; overflow-wrap: anywhere; font-size: 10px; font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    `;

      // iframe 内で描画し、Tailwind の lab/oklch が html2canvas に渡らないようにする
      iframe = document.createElement("iframe");
      iframe.title = "PDF出力用の一時プレビュー";
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      iframe.setAttribute(
        "style",
        "position: fixed; left: -9999px; top: 0; width: 1200px; height: 800px;",
      );
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) {
        throw new Error("PDFの描画領域を準備できませんでした。");
      }
      doc.open();
      doc.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;background:#ffffff;color:#171717;font-family:'Noto Sans JP','Hiragino Sans',sans-serif;">
        ${tableHtml}
      </body></html>
    `);
      doc.close();
      const container = doc.body;
      container.querySelectorAll("th, td").forEach((el) => {
        (el as HTMLElement).style.cssText =
          "border: 1px solid #333333; padding: 4px 8px; color: #171717; background-color: #ffffff;";
      });
      container.querySelectorAll("th").forEach((el) => {
        (el as HTMLElement).style.backgroundColor = "#047857";
        (el as HTMLElement).style.color = "#ffffff";
      });

      const width = container.scrollWidth;
      const height = container.scrollHeight;
      // html2canvas renders the full table before pagination. Bound both the
      // canvas edge and pixel area, even when a cell contains very long text.
      if (
        width > 15_000 ||
        height > 15_000 ||
        width * height * 4 > 64_000_000
      ) {
        throw new Error(
          "PDFの描画サイズが大きすぎます。文字数を減らすか、CSVで保存してください。",
        );
      }
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: `export_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(container)
        .save();
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "PDFを作成できませんでした。CSVで保存するか、データ量を減らして再試行してください。",
      );
    } finally {
      iframe?.remove();
      setExportingPdf(false);
    }
  }, [data, columnOrder, exportingPdf]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-700">
        CSVエクスポート
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="export-charset"
            className="mb-1 block text-xs text-stone-600"
          >
            文字コード
          </label>
          <select
            id="export-charset"
            value={options.charset}
            onChange={(e) =>
              onOptionsChange({ charset: e.target.value as Charset })
            }
            disabled={disabled}
            className="min-h-11 cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTF-8">UTF-8</option>
            <option value="Shift_JIS">Shift_JIS</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="export-delimiter"
            className="mb-1 block text-xs text-stone-600"
          >
            区切り文字
          </label>
          <select
            id="export-delimiter"
            value={options.delimiter}
            onChange={(e) =>
              onOptionsChange({ delimiter: e.target.value as Delimiter })
            }
            disabled={disabled}
            className="min-h-11 cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value=",">カンマ (,)</option>
            <option value="\t">タブ (\t)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="export-quote"
            className="mb-1 block text-xs text-stone-600"
          >
            囲み文字
          </label>
          <select
            id="export-quote"
            value={options.quoteChar}
            onChange={(e) =>
              onOptionsChange({ quoteChar: e.target.value as QuoteChar })
            }
            disabled={disabled}
            className="min-h-11 cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value='"'>ダブルクォート (&quot;)</option>
            <option value="">なし</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="export-line-ending"
            className="mb-1 block text-xs text-stone-600"
          >
            改行コード
          </label>
          <select
            id="export-line-ending"
            value={options.lineEnding}
            onChange={(e) =>
              onOptionsChange({ lineEnding: e.target.value as LineEnding })
            }
            disabled={disabled}
            className="min-h-11 cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="LF">LF</option>
            <option value="CRLF">CRLF</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={disabled || data.length === 0 || exportingCsv}
            className="min-h-11 cursor-pointer rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingCsv
              ? "出力中..."
              : options.delimiter === "\t"
                ? "TSV"
                : "CSV"}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={
              disabled ||
              data.length === 0 ||
              exportingPdf ||
              pdfLimitError !== null
            }
            aria-describedby={pdfLimitError ? "pdf-export-limit" : undefined}
            className="min-h-11 cursor-pointer rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingPdf ? "出力中..." : "PDF"}
          </button>
        </div>
      </div>
      {pdfLimitError && (
        <p id="pdf-export-limit" className="mt-3 text-sm text-stone-600">
          {pdfLimitError}
        </p>
      )}
      {exportError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {exportError}
        </p>
      )}
    </section>
  );
}
