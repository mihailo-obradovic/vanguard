<template>
  <!-- ! `min-height: 0` down the chain below is what makes the cap work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. `fixed-header` then keeps the column headers in place while the body moves. -->
  <GapContainer
    type="VSheet"
    elevation="1"
    class="users-table-sheet rounded-lg position-relative flex-1-1"
  >
    <!-- * Background refetch (isLoading upstream): the stale rows stay visible, this bar is the only affordance. Absolute, so appearing costs no layout shift. -->
    <v-progress-linear
      v-if="refreshing"
      indeterminate
      absolute
      color="primary"
      rounded
    />

    <v-table
      ref="table"
      fixed-header
      class="w-100 users-table"
      :class="[{ 'users-table--clipped': loading }, edgeClasses]"
    >
      <thead>
        <tr>
          <th class="font-weight-bold">{{ $t('users.columns.id') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.name') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.email') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.role') }}</th>
          <th class="font-weight-bold text-right">
            {{ $t('users.columns.actions') }}
          </th>
        </tr>
      </thead>

      <tbody :aria-busy="loading || undefined">
        <!-- * First-load skeleton: placeholder rows keep the header and column layout in place (`isPending` upstream). aria-hidden — aria-busy on the tbody already tells AT the region is loading. -->
        <template v-if="loading">
          <tr v-for="row in SKELETON_ROW_COUNT" :key="row" aria-hidden="true">
            <td v-for="column in 4" :key="column">
              <v-skeleton-loader type="text" />
            </td>

            <td />
          </tr>
        </template>

        <tr v-else-if="users.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-8">
            {{ $t('users.empty') }}
          </td>
        </tr>

        <template v-else>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <v-chip
                :color="user.role === 'admin' ? 'primary' : 'secondary'"
                variant="flat"
                size="small"
              >
                {{ $t(`users.roles.${user.role}`) }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                :aria-label="$t('users.actions.edit', { name: user.name })"
                icon
                variant="text"
                color="primary"
                size="small"
                @click="emit('edit', user)"
              >
                <v-icon :icon="mdiPencil" />
              </v-btn>

              <v-btn
                v-if="deletable && user.id !== currentUserId"
                :aria-label="$t('users.actions.delete', { name: user.name })"
                icon
                variant="text"
                color="error"
                size="small"
                :loading="deletingId === user.id"
                @click="emit('delete', user)"
              >
                <v-icon :icon="mdiDelete" />
              </v-btn>
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
  </GapContainer>
</template>

<script setup lang="ts">
import { mdiDelete, mdiPencil } from '@mdi/js';

import type { User } from '@/types/auth';

// * Enough placeholder rows to overflow any viewport. The wrapper clips the surplus while they show, which makes overshoot free and undershoot — a skeleton shorter than the data replacing it — the only visible failure.
const SKELETON_ROW_COUNT = 30;

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    users: User[];
    deletingId?: number | null;
    currentUserId?: number | null;
    // * Off for transports that expose no delete operation, e.g. the GraphQL demo.
    deletable?: boolean;
    // * First load in flight — renders skeleton rows in place of data.
    loading?: boolean;
    // * Background refetch in flight over already-shown rows — shows the top progress bar.
    refreshing?: boolean;
  }>(),
  {
    deletingId: null,
    currentUserId: null,
    deletable: true,
    loading: false,
    refreshing: false
  }
);

const emit = defineEmits<{
  edit: [user: User];
  delete: [user: User];
}>();
// Stryker restore all

const table = useTemplateRef<ComponentPublicInstance>('table');

// * Vuetify owns the scrolling element inside v-table, so the edge state is measured on it and the classes ride on the root.
const scroller = computed(
  () =>
    (table.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>(
      '.v-table__wrapper'
    ) ?? undefined
);

const edges = ref({ top: false, bottom: false, left: false, right: false });

const edgeClasses = computed(() => ({
  'edge-top': edges.value.top,
  'edge-bottom': edges.value.bottom
}));

// ! Suppressed while the skeleton shows: those rows overflow on purpose and the wrapper is clipped, so a rule there would assert hidden content the user is not being kept from.
function measure() {
  const el = scroller.value;

  edges.value =
    el && !props.loading
      ? scrollEdges(el)
      : { top: false, bottom: false, left: false, right: false };
}

useResizeObserver(
  computed(() => [scroller.value, table.value?.$el].filter(Boolean)),
  measure
);
useEventListener(scroller, 'scroll', measure, { passive: true });
watch(() => [props.loading, props.users], measure, { flush: 'post' });

onMounted(measure);
</script>

<style scoped>
/* * The sheet is a column so the table can take the height that is left in it, and the table is
   one so its scrolling wrapper can do the same inside that. Flexbox arrives at the same cap the
   measured version computed, and re-adapts on resize without watching anything. */
.users-table-sheet {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.users-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}

.users-table :deep(.v-table__wrapper) {
  min-height: 0;
  flex: 1 1 auto;
}

/* * The placeholder rows overflow on purpose, so the wrapper stops scrolling while they show:
   otherwise a scrollbar appears for the skeleton and vanishes again as the real rows arrive. */
.users-table--clipped :deep(.v-table__wrapper) {
  overflow: hidden;
}

/*
 * ! Reserved on both edges with only the colour changing, so an edge appearing never moves a row.
 * The sticky header covers neither: it begins inside the wrapper's border box, so the top rule is
 * visible above it — kept, because the header band is there whether or not content is hidden above
 * and so says nothing on its own.
 */
.users-table :deep(.v-table__wrapper) {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.users-table.edge-top :deep(.v-table__wrapper) {
  border-top-color: rgb(var(--v-theme-scroll-edge));
}

.users-table.edge-bottom :deep(.v-table__wrapper) {
  border-bottom-color: rgb(var(--v-theme-scroll-edge));
}
</style>
