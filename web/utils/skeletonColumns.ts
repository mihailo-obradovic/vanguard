import { USkeleton } from '#components';

import type { TableColumn } from '@nuxt/ui';

// * A row the skeleton columns render against. Every cell ignores it, so it carries nothing.
export type SkeletonRow = Record<string, never>;

// * Enough rows to overflow any viewport. The caller clips the surplus, which makes overshoot free and undershoot — a skeleton shorter than the data replacing it — the only visible failure.
export const SKELETON_ROW_COUNT = 30;

// * A text-line bar, sized to `td: 'p-4 text-sm'` in `config/nuxt-ui/table.ts`. Cells holding something taller pass their own shape.
const DEFAULT_SHAPE = 'h-4 w-full max-w-32';

// ! Blank rows typed as the real one, so a table's `data` keeps a single type across the swap rather than widening to a union its `columns` can no longer match. Safe only because this module also supplies the cells that render them, and every one ignores its row — never pair these rows with real columns.
export function skeletonRows<T = SkeletonRow>(): T[] {
  return Array.from({ length: SKELETON_ROW_COUNT }, () => ({}) as T);
}

// * Mirrors a table's columns as skeleton ones: same headers, order and count, every cell a placeholder box. `shapes` is keyed by the real column's `accessorKey` or `id`.
export function skeletonColumns<T>(
  columns: TableColumn<T>[],
  shapes: Record<string, string> = {}
): TableColumn<T>[] {
  return columns.map((column, index) => ({
    // ! Never the real column's id: `Table.vue` prefers a `#<id>-cell` slot over `columnDef.cell`, so a real id would let the page's own cell template draw the placeholder — and read fields off a row that has none.
    id: `skeleton-${index}`,
    // * The header is loaded already, so it stays. Only the body goes skeletal.
    header: columnHeader(column),
    cell: () =>
      h(USkeleton, { class: shapes[columnKey(column)] ?? DEFAULT_SHAPE })
  }));
}

function columnKey<T>(column: TableColumn<T>): string {
  if ('accessorKey' in column) {
    return String(column.accessorKey);
  }

  return column.id ?? '';
}

// ! String headers only. A TanStack header render function is typed to the real row and would be handed a skeleton one, so such a column loses its header while pending rather than crashing. Every column here heads with a `t()` string.
function columnHeader<T>(column: TableColumn<T>): string | undefined {
  if ('header' in column && typeof column.header === 'string') {
    return column.header;
  }

  return undefined;
}
