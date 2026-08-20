<template>
  <!-- * Chrome on the branded bar: ghost so the bar's colour shows through, inheriting its text colour rather than the neutral one. Matches the other header controls exactly — nothing here is worth a second colour. -->
  <template v-if="isLoggedIn">
    <!-- * The signed-in user's own name, which is the account affordance the sidebar's generic "Profile" entry cannot be. -->
    <!-- ! `label` rather than slot content: the button squares itself only when it has neither, and a slot declared behind a `v-if` still counts as one. The name moves to `aria-label` when it stops being visible, so the control keeps its accessible name. -->
    <u-button
      to="/profile"
      icon="i-lucide-user"
      :label="isCompactHeader ? undefined : user?.name"
      :aria-label="isCompactHeader ? user?.name : undefined"
      v-bind="CHROME"
    />

    <u-button
      :loading="isLoggingOut"
      icon="i-lucide-log-out"
      :label="logoutLabel"
      :aria-label="isCompactHeader ? $t('common.nav.logout') : undefined"
      v-bind="CHROME"
      @click="logOut()"
    />
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
import { breakpointsTailwind } from '@vueuse/core';

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

const { t } = useI18n();

const breakpoints = useBreakpoints(breakpointsTailwind);

const isCompactHeader = breakpoints.smaller('sm');

const overlay = useOverlay();

const { isLoggedIn, user } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut();

const logoutLabel = computed(() => {
  if (isCompactHeader.value) {
    return undefined;
  }

  return isLoggingOut.value
    ? t('common.nav.logoutPending')
    : t('common.nav.logout');
});

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
