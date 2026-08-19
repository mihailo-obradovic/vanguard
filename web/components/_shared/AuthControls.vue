<template>
  <!-- * Chrome on the branded bar: ghost so the bar's colour shows through, inheriting its text colour rather than the neutral one. Matches the other header controls exactly — nothing here is worth a second colour. -->
  <template v-if="isLoggedIn">
    <!-- * The signed-in user's own name, which is the account affordance the sidebar's generic "Profile" entry cannot be. -->
    <u-button to="/profile" icon="i-lucide-user" v-bind="CHROME">
      {{ user?.name }}
    </u-button>

    <u-button
      :loading="isLoggingOut"
      icon="i-lucide-log-out"
      v-bind="CHROME"
      @click="logOut()"
    >
      {{
        isLoggingOut ? $t('common.nav.logoutPending') : $t('common.nav.logout')
      }}
    </u-button>
  </template>

  <template v-else>
    <u-button icon="i-lucide-log-in" v-bind="CHROME" @click="openAuth('login')">
      {{ $t('common.nav.login') }}
    </u-button>

    <u-button
      icon="i-lucide-user-plus"
      v-bind="CHROME"
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

const CHROME = {
  color: 'neutral',
  variant: 'ghost',
  class: 'text-inverted hover:bg-inverted/10'
} as const;

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
