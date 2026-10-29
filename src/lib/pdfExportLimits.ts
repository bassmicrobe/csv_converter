export const MAX_PDF_ROWS = 500;
export const MAX_PDF_CELLS = 10_000;

export function getPdfLimitError(
  data: string[][],
  columnOrder?: number[],
): string | null {
  if (data.length > MAX_PDF_ROWS) {
    return "PDFは最大500行・10,000セルまでです。大きな表はCSVで保存してください。";
  }
  const columns =
    columnOrder?.length ||
    data.reduce((max, row) => Math.max(max, row.length), 0);
  if (data.length * columns > MAX_PDF_CELLS) {
    return "PDFは最大500行・10,000セルまでです。大きな表はCSVで保存してください。";
  }
  return null;
}
