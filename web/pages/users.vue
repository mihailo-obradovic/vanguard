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

      <!-- * A static shell: it keeps the border and the radius so the scrolling element inside carries no structural edge of its own, which is the split `scroll-affordance.md` asks for. `overflow-hidden` clips the table's corners to the radius. -->
      <div
        class="bg-card flex min-h-0 flex-col overflow-hidden rounded-md border shadow-xs"
      >
        <!-- ! `min-h-0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. The sticky header then keeps the column names in place while the body moves — and, sitting inside this region, it covers the top edge rule, which is why only the bottom one is ever visible here. -->
        <UIScrollArea class="min-h-0 flex-1">
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
        </UIScrollArea>
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

    <!-- * An AlertDialog rather than a Dialog: deleting a user is a destructive confirmation, and this one carries the role and focus defaults that go with it. -->
    <AlertDialog :open="!!userToDelete" @update:open="handleDeleteDialogToggle">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('users.delete.title') }}</AlertDialogTitle>

          <AlertDialogDescription>
            <!-- * `scope="global"`: the Translation component resolves against its PARENT's scope by default, and its parent here is AlertDialogDescription, which enables no scope of its own. Without this it warns and falls back to global anyway — this says so out loud. -->
            <i18n-t keypath="users.delete.confirm" tag="span" scope="global">
              <template #name>
                <strong>"{{ userToDelete?.name }}"</strong>
              </template>
            </i18n-t>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p class="text-destructive text-sm italic">
          {{ $t('users.delete.warning') }}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting" @click="cancelDelete">
            {{ $t('common.actions.cancel') }}
          </AlertDialogCancel>

          <AlertDialogAction
            :class="buttonVariants({ variant: 'destructive' })"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            <UIReservedLabel
              :variants="{
                idle: $t('users.delete.submit'),
                pending: $t('common.actions.deleting')
              }"
              :active="isDeleting ? 'pending' : 'idle'"
            />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import UserFormDialog from '@/components/users/UserFormDialog.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
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

// * Reka closes on Escape and on the overlay as well as on Cancel; all of them arrive here.
function handleDeleteDialogToggle(open: boolean) {
  if (!open) {
    cancelDelete();
  }
}

function handleDelete() {
  if (!userToDelete.value) {
    return;
  }

  deleteUser(userToDelete.value.id);
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
