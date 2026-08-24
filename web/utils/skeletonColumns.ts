import { USkeleton } from '#components';

import type { TableColumn } from '@nuxt/ui';

// * A row the skeleton columns render against. Every cell ignores it, so it carries nothing.
export type SkeletonRow = Record<string, never>;

// * Enough rows to overflow any viewport. The table clips them while pending (`overflow-hidden` at the call site), so overshooting costs nothing and undershooting is the only visible failure — a skeleton shorter than the data it stands in for, which is the jump this whole mechanism exists to remove.
export const SKELETON_ROW_COUNT = 30;

// * A text-line bar, sized to `td: 'p-4 text-sm'` from `config/nuxt-ui/table.ts`. Columns holding something taller than a line of text (a badge, a button) pass their own shape.
const DEFAULT_SHAPE = 'h-4 w-full max-w-32';

export function skeletonRows(): SkeletonRow[] {
  return Array.from({ length: SKELETON_ROW_COUNT }, () => ({}) as SkeletonRow);
}

// * Mirrors a table's real columns as skeleton ones: same headers, same order, same count, with every cell replaced by a placeholder box. `shapes` is keyed by the real column's `accessorKey` or `id`.
export function skeletonColumns<T>(
  columns: TableColumn<T>[],
  shapes: Record<string, string> = {}
): TableColumn<SkeletonRow>[] {
  return columns.map((column, index) => ({
    // ! Never the real column's id. `Table.vue` renders `<slot name="{id}-cell">` in preference to `columnDef.cell`, so a skeleton column reusing the real id would be drawn by the page's own cell template — which reads `row.original.role` and friends off a row that has no fields.
    id: `skeleton-${index}`,
    // * The header is real data and it is already loaded, so it stays. Only the body is skeletal.
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

// ! String headers only. TanStack also allows a header render function, but its context is typed to the real row and would be handed a skeleton one — so a table with a rendered header loses it while pending rather than crashing. Every column in this project heads with a `t()` string.
function columnHeader<T>(column: TableColumn<T>): string | undefined {
  if ('header' in column && typeof column.header === 'string') {
    return column.header;
  }

  return undefined;
}
