<template>
  <!-- * A column filling `main`, so the table below can take the space that is left rather than growing the page. -->
  <div class="mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col">
    <header class="mb-6 shrink-0 border-b pb-4">
      <h1 class="text-primary text-3xl font-semibold">
        {{ $t('graphqlDemo.title') }}
      </h1>

      <p class="text-muted-foreground mt-2">{{ $t('graphqlDemo.intro') }}</p>
    </header>

    <p v-if="isPending" class="bg-card rounded-md border p-8 text-center">
      {{ $t('users.loading') }}
    </p>

    <p
      v-else-if="error"
      class="text-destructive border-destructive/40 bg-destructive/10 rounded-md border p-8 text-center"
    >
      {{ $t('errors.usersLoad', { message: getErrorMessage(error) }) }}
    </p>

    <!-- * A static shell carrying the border and the radius; `overflow-hidden` clips the table's corners to the radius. -->
    <div
      v-else
      class="bg-card flex min-h-0 flex-col overflow-hidden rounded-md border shadow-xs"
    >
      <!-- ! `min-h-0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. -->
      <!-- * Both axes: the table is about 600px wide, so on a phone the Edit column sits off to the right. A plain overflow region rather than `UIScrollArea` — the shell's border and the header band already mark the clipped edges (see `users.vue`). -->
      <div class="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-primary">
              <TableHead v-for="column in COLUMNS" :key="column" :class="HEAD">
                {{ $t(`users.columns.${column}`) }}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-for="user in users" :key="user.id">
              <TableCell>{{ user.id }}</TableCell>
              <TableCell class="font-medium">{{ user.name }}</TableCell>
              <TableCell class="text-muted-foreground">
                {{ user.email }}
              </TableCell>
              <TableCell><RoleBadge :role="user.role" /></TableCell>
              <TableCell>
                <Button variant="outline" size="sm" @click="openEditForm(user)">
                  {{ $t('common.actions.edit') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <UserGqlFormDialog
      :user="editingUser"
      :submitting="isUpdating"
      :server-errors="formErrors"
      @update="updateUser"
      @close="closeEditForm"
    />
  </div>
</template>

<script setup lang="ts">
import UserGqlFormDialog from '@/components/users/UserGqlFormDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import {
  useFetchUsersGql,
  useUpdateUserGql
} from '@/services/queries/useUserGqlQueries';
import type { User } from '@/types/auth';

// * Worked example for catalyst/features/007_graphql-api.md: this page is written exactly the
// * way the REST pages are — query composables, no loading refs, no try/catch, inline 422s.
// * The only difference from users.vue is which composables it imports.

// * The column set, so the headers are one loop rather than five near-identical rows.
const COLUMNS = ['id', 'name', 'email', 'role', 'actions'] as const;

// * The header is brand-filled and sticks to the scrolling region's top, so it needs an opaque fill of its own to cover the rows passing under it.
const HEAD = 'bg-primary text-primary-foreground sticky top-0 z-10';

const { t } = useI18n();

const { data: users, isPending, error } = useFetchUsersGql();

const editingUser = ref<User | null>(null);

const {
  mutate: updateUser,
  isLoading: isUpdating,
  error: updateError
} = useUpdateUserGql({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (updatedUser) => {
    $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success');
    closeEditForm();
  }
});

const formErrors = useValidationErrors(updateError);

function openEditForm(user: User) {
  editingUser.value = user;
}

function closeEditForm() {
  editingUser.value = null;
}
</script>
