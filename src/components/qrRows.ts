export const MAX_QR = 1000;

export function selectQrRows(
  data: string[][],
  hasHeaderRow: boolean,
  filteredIndices: number[] | null,
) {
  const start = hasHeaderRow ? 1 : 0;
  if (filteredIndices === null) {
    return {
      rows: data.slice(start, start + MAX_QR),
      totalRows: Math.max(0, data.length - start),
    };
  }

  const rows: string[][] = [];
  let totalRows = 0;
  for (const index of filteredIndices) {
    if (!Number.isInteger(index) || index < start || index >= data.length)
      continue;
    totalRows++;
    if (rows.length < MAX_QR) rows.push(data[index]);
  }
  return { rows, totalRows };
}
