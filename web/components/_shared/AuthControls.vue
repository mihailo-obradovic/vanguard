<template>
  <!-- * The session controls, rendered twice by the layout — once in the header's right slot and once inside the mobile menu — so the two can never drift apart. -->
  <template v-if="isLoggedIn">
    <u-button
      to="/profile"
      icon="i-lucide-user"
      variant="soft"
      color="neutral"
      :block="block"
      :class="block && 'justify-start'"
    >
      {{ user?.name }}
    </u-button>

    <u-button
      color="error"
      icon="i-lucide-log-out"
      :loading="isLoggingOut"
      :block="block"
      :class="block && 'justify-start'"
      @click="logOut()"
    >
      {{
        isLoggingOut ? $t('common.nav.logoutPending') : $t('common.nav.logout')
      }}
    </u-button>
  </template>

  <template v-else>
    <u-button
      icon="i-lucide-log-in"
      variant="outline"
      :block="block"
      :class="block && 'justify-start'"
      @click="openAuth('login')"
    >
      {{ $t('common.nav.login') }}
    </u-button>

    <u-button
      icon="i-lucide-user-plus"
      :block="block"
      :class="block && 'justify-start'"
      @click="openAuth('register')"
    >
      {{ $t('common.nav.register') }}
    </u-button>
  </template>
</template>

<script setup lang="ts">
import { useLogOut } from '@/services/queries/useAuthQueries';

import LoginDialog from '@/components/auth/LoginDialog.vue';
import RegisterDialog from '@/components/auth/RegisterDialog.vue';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog.vue';

import type { AuthDialog } from '@/types/auth';

defineProps<{ block?: boolean }>();

const AUTH_DIALOGS = {
  login: LoginDialog,
  register: RegisterDialog,
  'forgot-password': ForgotPasswordDialog
};

const overlay = useOverlay();

const { isLoggedIn, user } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut();

async function openAuth(dialog: AuthDialog) {
  const result = await overlay
    .create(AUTH_DIALOGS[dialog], { destroyOnClose: true })
    .open();

  // * A dialog resolves with the name of another one when the user asked to switch instead of finishing.
  if (typeof result === 'string') {
    await openAuth(result);
  }
}
</script>
