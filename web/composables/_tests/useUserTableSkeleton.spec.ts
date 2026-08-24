// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { ref, computed } from 'vue';

import { useUserTableSkeleton } from '../useUserTableSkeleton';

import { SKELETON_ROW_COUNT } from '@/utils/skeletonColumns';

import type { TableColumn } from '@nuxt/ui';
import type { User } from '@/types/auth';

const columns = computed<TableColumn<User>[]>(() => [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { id: 'actions', header: 'Actions' }
]);

const user = { id: 1, name: 'Ada', role: 'admin' } as User;

function setup(isPending = ref(false), shapes?: Record<string, string>) {
  return useUserTableSkeleton(columns, ref([user]), isPending, shapes);
}

describe('useUserTableSkeleton', () => {
  it('binds the real rows and columns once loaded', () => {
    const { data, columns: bound } = setup();

    expect(data.value).toEqual([user]);
    expect(bound.value).toEqual(columns.value);
  });

  it('fills the table with placeholder rows while pending', () => {
    const { data } = setup(ref(true));

    expect(data.value).toHaveLength(SKELETON_ROW_COUNT);
  });

  // ! Rows and columns have to swap together: skeleton rows under real columns would hand the page's own cell templates an empty object.
  it('swaps columns in the same breath as rows', () => {
    const { columns: bound } = setup(ref(true));

    expect(bound.value.map((column) => column.id)).toEqual([
      'skeleton-0',
      'skeleton-1',
      'skeleton-2'
    ]);
  });

  it('tracks the pending flag rather than sampling it once', () => {
    const isPending = ref(true);
    const { data } = setup(isPending);

    isPending.value = false;

    expect(data.value).toEqual([user]);
  });

  it('holds the table together when the query has produced nothing yet', () => {
    const { data } = useUserTableSkeleton(columns, ref(undefined), ref(false));

    expect(data.value).toEqual([]);
  });

  it('lets a caller narrow one column without losing the shared shapes', () => {
    const { columns: bound } = setup(ref(true), { actions: 'ms-auto h-7 w-7' });

    expect(bound.value).toHaveLength(columns.value.length);
  });
});
