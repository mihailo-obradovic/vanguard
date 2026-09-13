<template>
  <!-- * A column filling `main`, so the table below can take the space that is left rather than growing the page. -->
  <div class="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">
    <div class="mb-6 flex shrink-0 items-center justify-between border-b pb-4">
      <h1 class="text-primary text-3xl font-semibold">
        {{ $t('users.title') }}
      </h1>

      <Button @click="openCreateForm">{{ $t('users.create') }}</Button>
    </div>

    <p v-if="isPending" class="bg-card rounded-md border p-8 text-center">
      {{ $t('users.loading') }}
    </p>

    <p
      v-else-if="error"
      class="text-destructive border-destructive/40 bg-destructive/10 rounded-md border p-8 text-center"
    >
      {{ $t('errors.usersLoad', { message: getErrorMessage(error) }) }}
    </p>

    <div v-else class="flex min-h-0 flex-1 flex-col">
      <p class="text-muted-foreground mb-4 shrink-0">
        {{ $t('users.total') }}
        <span class="text-primary font-semibold">{{ users.length }}</span>
      </p>

      <!-- * A static shell carrying the border and the radius; `overflow-hidden` clips the table's corners to the radius. -->
      <div
        class="bg-card flex min-h-0 flex-col overflow-hidden rounded-md border shadow-xs"
      >
        <!-- ! `min-h-0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. The sticky header then keeps the column names in place while the body moves. -->
        <!-- * Both axes: seven columns are about 935px wide, so on a phone Edit and Delete sit off to the right. A plain overflow region, not `UIScrollArea`: the shell's border and the filled header band already mark where the table is clipped — the adjacent-chrome exemption in `scroll-affordance.md` — so edge rules would only draw a second line along them. -->
        <div class="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-primary">
                <TableHead
                  v-for="column in COLUMNS"
                  :key="column"
                  :class="HEAD"
                >
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
                  <VerificationBadge :verified="!!user.email_verified_at">
                    <!-- * The badge's wording is the caller's, so the caller reserves it — same auto-layout column as the role beside it. -->
                    <UIReservedLabel
                      :variants="{
                        yes: $t('users.verified.yes'),
                        no: $t('users.verified.no')
                      }"
                      :active="user.email_verified_at ? 'yes' : 'no'"
                    />
                  </VerificationBadge>
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {{ formatDate(user.created_at) }}
                </TableCell>
                <TableCell>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      :disabled="isDeletingUser === user.id"
                      @click="openEditForm(user)"
                    >
                      {{ $t('common.actions.edit') }}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      :disabled="isDeletingUser === user.id"
                      @click="confirmDelete(user)"
                    >
                      <UIReservedLabel
                        :variants="{
                          idle: $t('common.actions.delete'),
                          pending: $t('common.actions.deleting')
                        }"
                        :active="
                          isDeletingUser === user.id ? 'pending' : 'idle'
                        "
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    <UserFormDialog
      :open="showUserForm"
      :user="userBeingEdited"
      :submitting="isSubmittingUser"
      :server-errors="userFormErrors"
      @create="createUser"
      @update="handleUpdateUser"
      @close="closeUserForm"
    />

    <UserDeleteDialog
      :user="userToDelete"
      :deleting="isDeleting"
      @confirm="deleteUser"
      @close="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import UserFormDialog from '@/components/users/UserFormDialog.vue';
import UserDeleteDialog from '@/components/users/UserDeleteDialog.vue';
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
  useFetchUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '@/services/queries/useUserQueries';
import type { User } from '@/types/auth';
import type { UpdateUserForm } from '@/types/user';

// * The column set, so the seven headers are one loop rather than seven near-identical rows.
const COLUMNS = [
  'id',
  'name',
  'email',
  'role',
  'emailVerified',
  'createdAt',
  'actions'
] as const;

// * The header is brand-filled and sticks to the scrolling region's top, so it needs an opaque fill of its own to cover the rows passing under it.
const HEAD = 'bg-primary text-primary-foreground sticky top-0 z-10';

const { t } = useI18n();

const { data: usersResponse, isPending, error } = useFetchUsers();

const userToDelete = ref<User | null>(null);

// * The form's subject: a user to edit, or `null` to create one. It outlives the open flag, so nothing has to be cleared on close.
const showUserForm = ref(false);
const userBeingEdited = ref<User | null>(null);

const {
  mutate: createUser,
  isLoading: isCreatingUser,
  error: createUserError
} = useCreateUser({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (newUser) => {
    $toast(t('users.toasts.created', { name: newUser.name }), 'success');
    closeUserForm();
  }
});

const {
  mutate: updateUser,
  isLoading: isUpdatingUser,
  error: updateUserError
} = useUpdateUser({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (updatedUser) => {
    $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success');
    closeUserForm();
  }
});

const {
  mutate: deleteUser,
  isLoading: isDeleting,
  variables: deletingId
} = useDeleteUser({
  onSuccess: () => {
    $toast(
      t('users.toasts.deleted', { name: userToDelete.value?.name ?? '' }),
      'success'
    );
  },
  onSettled: () => {
    userToDelete.value = null;
  }
});

const userFormErrors = useValidationErrors(
  computed(() =>
    userBeingEdited.value ? updateUserError.value : createUserError.value
  )
);

const users = computed(() => usersResponse.value?.data ?? []);

const isSubmittingUser = computed(
  () => isCreatingUser.value || isUpdatingUser.value
);

const isDeletingUser = computed(() =>
  isDeleting.value ? (deletingId.value ?? null) : null
);

function confirmDelete(user: User) {
  userToDelete.value = user;
}

function cancelDelete() {
  userToDelete.value = null;
}

// * Create/Edit form functions
function openCreateForm() {
  userBeingEdited.value = null;
  showUserForm.value = true;
}

function openEditForm(user: User) {
  userBeingEdited.value = user;
  showUserForm.value = true;
}

function closeUserForm() {
  showUserForm.value = false;
}

function handleUpdateUser(id: number, userData: UpdateUserForm) {
  updateUser({ id, userData });
}
</script>
