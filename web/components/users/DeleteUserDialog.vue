<template>
  <u-modal
    :open="open"
    :title="$t('users.delete.title')"
    @update:open="handleOpenChange"
  >
    <template #body>
      <!-- * `scope="global"`: the Translation component resolves against its PARENT's scope by default, and its parent here is the modal's slot content, which enables no scope of its own. Without this it warns and falls back to global anyway — this says so out loud. -->
      <i18n-t keypath="users.delete.confirm" tag="p" scope="global">
        <template #name>
          <strong>"{{ user.name }}"</strong>
        </template>
      </i18n-t>

      <p class="mt-2 text-sm text-error italic">
        {{ $t('users.delete.warning') }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button color="neutral" variant="outline" @click="emit('close')">
          {{ $t('common.actions.cancel') }}
        </u-button>

        <u-button
          color="error"
          :loading="isDeleting"
          @click="deleteUser(user.id)"
        >
          {{
            isDeleting
              ? $t('common.actions.deleting')
              : $t('users.delete.submit')
          }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { useDeleteUser } from '@/services/queries/useUserQueries';

import type { User } from '@/types/auth';

const props = defineProps<{ user: User }>();

const emit = defineEmits<{ close: [deleted?: true] }>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();

const { mutate: deleteUser, isLoading: isDeleting } = useDeleteUser({
  onSuccess: () => {
    $toast(t('users.toasts.deleted', { name: props.user.name }), 'success');
    emit('close', true);
  }
});

function handleOpenChange(next: boolean) {
  open.value = next;

  if (!next) {
    emit('close');
  }
}
</script>
