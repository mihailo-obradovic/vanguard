import type { TableColumn } from '@nuxt/ui';
import type { User } from '@/types/auth';

// * Placeholder geometry for the user tables: badge-height where a badge lands, button-sized for the row actions, a text bar elsewhere. Keyed by the real column's `accessorKey` or `id`.
const USER_SHAPES: Record<string, string> = {
  id: 'h-4 w-8',
  name: 'h-4 w-32',
  email: 'h-4 w-48',
  role: 'h-6 w-14',
  email_verified_at: 'h-6 w-12',
  created_at: 'h-4 w-28',
  actions: 'ms-auto h-7 w-15'
};

// * The `:data` and `:columns` a user table binds: real ones once loaded, placeholders while `isPending`. Both swap together — the skeleton columns only ever render skeleton rows.
export function useUserTableSkeleton(
  columns: Ref<TableColumn<User>[]>,
  users: Ref<User[] | undefined>,
  isPending: Ref<boolean>,
  shapes: Record<string, string> = {}
) {
  const merged = { ...USER_SHAPES, ...shapes };

  return {
    data: computed(() =>
      isPending.value ? skeletonRows<User>() : (users.value ?? [])
    ),
    columns: computed(() =>
      isPending.value ? skeletonColumns(columns.value, merged) : columns.value
    )
  };
}
