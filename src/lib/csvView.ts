const sortCollator = new Intl.Collator("ja");

export function filterRowIndices(
  data: string[][],
  column: number,
  query: string,
  startRow = 0,
): number[] | null {
  if (!query.trim() || column < 0) return null;
  const lower = query.toLowerCase();
  const indices: number[] = [];
  for (let index = startRow; index < data.length; index++) {
    if ((data[index][column] ?? "").toLowerCase().includes(lower)) {
      indices.push(index);
    }
  }
  return indices;
}

export function sortRowIndices(
  data: string[][],
  indices: number[],
  column: number,
  direction: "asc" | "desc",
): number[] {
  const multiplier = direction === "asc" ? 1 : -1;
  // Normalize once per row, rather than twice for every sort comparison.
  return indices
    .map((index) => ({
      index,
      value: (data[index]?.[column] ?? "").toLowerCase(),
    }))
    .sort((a, b) => multiplier * sortCollator.compare(a.value, b.value))
    .map(({ index }) => index);
}
