"use client";

import { useCallback, useState } from "react";
import iconv from "iconv-lite";
import { exportCsv } from "@/lib/csvExporter";
import type { CsvOptions, Charset, Delimiter, QuoteChar, LineEnding } from "@/lib/types";

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

  const handleExport = useCallback(() => {
    setExportingCsv(true);
    const exportData = columnOrder?.length
      ? data.map((row) => columnOrder.map((i) => row[i] ?? ""))
      : data;
    const csv = exportCsv(exportData, options);
    const raw =
      options.charset === "Shift_JIS"
        ? iconv.encode(csv, "shiftjis")
        : new TextEncoder().encode(csv);
    const bytes = new Uint8Array(raw);
    const blob = new Blob([bytes], {
      type: options.charset === "Shift_JIS" ? "text/csv;charset=shift-jis" : "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    requestAnimationFrame(() => setExportingCsv(false));
  }, [data, columnOrder, options]);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    const exportData = columnOrder?.length
      ? data.map((row) => columnOrder.map((i) => row[i] ?? ""))
      : data;
    if (exportData.length === 0) return;

    const thead = exportData[0]
      .map((cell) => `<th>${escapeHtml(cell)}</th>`)
      .join("");
    const tbody = exportData
      .slice(1)
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
      )
      .join("");

    const tableHtml = `
      <table style="border-collapse: collapse; font-size: 10px; font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    `;

    // iframe 内で描画し、Tailwind の lab/oklch が html2canvas に渡らないようにする
    const iframe = document.createElement("iframe");
    iframe.setAttribute("style", "position: fixed; left: -9999px; top: 0; width: 1200px; height: 800px;");
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      setExportingPdf(false);
      return;
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
      (el as HTMLElement).style.backgroundColor = "#f59e0b";
      (el as HTMLElement).style.color = "#ffffff";
    });

    try {
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
    } finally {
      document.body.removeChild(iframe);
      setExportingPdf(false);
    }
  }, [data, columnOrder]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-700">
        CSVエクスポート
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-stone-600">文字コード</label>
          <select
            value={options.charset}
            onChange={(e) => onOptionsChange({ charset: e.target.value as Charset })}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTF-8">UTF-8</option>
            <option value="Shift_JIS">Shift_JIS</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-600">区切り文字</label>
          <select
            value={options.delimiter}
            onChange={(e) => onOptionsChange({ delimiter: e.target.value as Delimiter })}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value=",">カンマ (,)</option>
            <option value="\t">タブ (\t)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-600">囲み文字</label>
          <select
            value={options.quoteChar}
            onChange={(e) => onOptionsChange({ quoteChar: e.target.value as QuoteChar })}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value='"'>ダブルクォート (&quot;)</option>
            <option value="">なし</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-600">改行コード</label>
          <select
            value={options.lineEnding}
            onChange={(e) => onOptionsChange({ lineEnding: e.target.value as LineEnding })}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="LF">LF</option>
            <option value="CRLF">CRLF</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={disabled || data.length === 0 || exportingCsv}
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingCsv ? "出力中..." : "CSV"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={disabled || data.length === 0 || exportingPdf}
            className="cursor-pointer rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingPdf ? "出力中..." : "PDF"}
          </button>
        </div>
      </div>
    </section>
  );
}
