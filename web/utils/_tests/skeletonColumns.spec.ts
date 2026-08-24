// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';

import {
  SKELETON_ROW_COUNT,
  skeletonColumns,
  skeletonRows
} from '../skeletonColumns';

import type { TableColumn } from '@nuxt/ui';

type User = { id: number; name: string; role: string };

const columns: TableColumn<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { id: 'actions', header: 'Actions' }
];

// * Renders a column's `cell` in isolation so the placeholder's classes can be asserted. The context is never read — the whole point is that skeleton cells ignore their row.
function renderCell<T>(column: TableColumn<T>) {
  const cell = column.cell as () => ReturnType<typeof h>;

  return mount({ render: () => cell() });
}

describe('skeletonRows', () => {
  it('produces enough rows to overflow a viewport', () => {
    expect(skeletonRows()).toHaveLength(SKELETON_ROW_COUNT);
  });

  it('produces rows with no fields, so no cell can read one', () => {
    expect(skeletonRows().every((row) => Object.keys(row).length === 0)).toBe(
      true
    );
  });
});

describe('skeletonColumns', () => {
  // ! The regression this guards: reusing a real id lets the page's `#role-cell` template win over `columnDef.cell` and read `row.original.role` off an empty row.
  it('gives every column a fresh id, never the real one', () => {
    const ids = skeletonColumns(columns).map((column) => column.id);

    expect(ids).toEqual([
      'skeleton-0',
      'skeleton-1',
      'skeleton-2',
      'skeleton-3'
    ]);
  });

  it('keeps the real headers, so the header row stays loaded', () => {
    const headers = skeletonColumns(columns).map((column) =>
      'header' in column ? column.header : undefined
    );

    expect(headers).toEqual(['ID', 'Name', 'Role', 'Actions']);
  });

  it('mirrors the column count and order', () => {
    expect(skeletonColumns(columns)).toHaveLength(columns.length);
  });

  it('renders a text-line placeholder by default', () => {
    const [first] = skeletonColumns(columns);

    expect(renderCell(first!).attributes('class')).toContain('h-4');
  });

  it('applies a shape override keyed by accessorKey', () => {
    const shaped = skeletonColumns(columns, {
      role: 'h-6 w-16 rounded-full'
    });

    expect(renderCell(shaped[2]!).attributes('class')).toContain('h-6');
  });

  it('applies a shape override keyed by id, for columns without an accessor', () => {
    const shaped = skeletonColumns(columns, { actions: 'ms-auto size-8' });

    expect(renderCell(shaped[3]!).attributes('class')).toContain('size-8');
  });

  it('leaves other columns on the default shape when one is overridden', () => {
    const shaped = skeletonColumns(columns, { role: 'h-6 w-16' });

    expect(renderCell(shaped[1]!).attributes('class')).toContain('h-4');
  });
});
