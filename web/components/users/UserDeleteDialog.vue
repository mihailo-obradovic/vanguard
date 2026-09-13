<template>
  <!-- * An AlertDialog rather than a Dialog: deleting a user is a destructive confirmation, and this one carries the role and the cancel-focused default that go with it. -->
  <AlertDialog :open="user !== null" @update:open="handleOpenChange">
    <!-- * A deleted user's row takes its Delete button with it, so Reka's own restore would land on <body>; `restoreFocus` sends focus to the main landmark instead. -->
    <AlertDialogContent @close-auto-focus="restoreFocus">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('users.delete.title') }}</AlertDialogTitle>

        <AlertDialogDescription>
          <!-- * `scope="global"`: the Translation component resolves against its PARENT's scope by default, and its parent here is AlertDialogDescription, which enables no scope of its own. Without this it warns and falls back to global anyway — this says so out loud. -->
          <i18n-t keypath="users.delete.confirm" tag="span" scope="global">
            <template #name>
              <strong>"{{ user?.name }}"</strong>
            </template>
          </i18n-t>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <p class="text-destructive text-sm italic">
        {{ $t('users.delete.warning') }}
      </p>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleting">
          {{ $t('common.actions.cancel') }}
        </AlertDialogCancel>

        <!-- ! A plain Button, not AlertDialogAction: that one is Reka's DialogClose, which closes the dialog before any click listener runs — the owner cleared its subject on that close, and the delete it was about to send found nothing. The dialog stays open, pending, until the owner closes it. -->
        <Button
          variant="destructive"
          :disabled="deleting"
          @click="handleConfirm"
        >
          <UIReservedLabel
            :variants="{
              idle: $t('users.delete.submit'),
              pending: $t('common.actions.deleting')
            }"
            :active="deleting ? 'pending' : 'idle'"
          />
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import type { User } from '@/types/auth';

const props = defineProps<{
  // * The user to delete, or `null` — the only thing that decides whether the dialog is open.
  user: User | null;
  deleting: boolean;
}>();

const emit = defineEmits<{
  confirm: [id: number];
  close: [];
}>();

const { restoreFocus } = useFocusReturn(() => props.user !== null);

function handleConfirm() {
  if (!props.user) {
    return;
  }

  emit('confirm', props.user.id);
}

// * Cancel, Escape and the overlay all arrive here. While the delete is in flight none of them may close it — Cancel is disabled for the same reason — so the pending state stays on screen until the owner settles it.
function handleOpenChange(open: boolean) {
  if (open || props.deleting) {
    return;
  }

  emit('close');
}
</script>
