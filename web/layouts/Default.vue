<template>
  <div class="flex h-full flex-col">
    <SkipLink />

    <nav class="bg-elevated/50 border-default border-b">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 p-2"
      >
        <div class="flex items-center gap-1">
          <u-button
            to="/home"
            icon="i-lucide-house"
            variant="ghost"
            color="neutral"
            active-variant="soft"
          >
            {{ $t('common.nav.home') }}
          </u-button>

          <u-button
            v-if="isAdmin"
            to="/users"
            icon="i-lucide-users"
            variant="ghost"
            color="neutral"
            active-variant="soft"
          >
            {{ $t('common.nav.users') }}
          </u-button>

          <u-button
            v-if="isAdmin"
            to="/graphql-demo"
            icon="i-lucide-braces"
            variant="ghost"
            color="neutral"
            active-variant="soft"
          >
            {{ $t('common.nav.graphqlDemo') }}
          </u-button>
        </div>

        <div class="flex items-center gap-2">
          <!-- * Nuxt UI's own toggle over @nuxtjs/color-mode, which @nuxt/ui registers; it reads and writes the preference cookie itself, so there is no hand-rolled theme switching to keep. -->
          <u-color-mode-button :aria-label="$t('common.nav.colorMode')" />

          <LocaleSwitcher />

          <template v-if="isLoggedIn">
            <u-button
              to="/profile"
              icon="i-lucide-user"
              variant="soft"
              color="neutral"
            >
              {{ user?.name }}
            </u-button>

            <u-button
              color="error"
              icon="i-lucide-log-out"
              :loading="isLoggingOut"
              @click="logOut()"
            >
              {{
                isLoggingOut
                  ? $t('common.nav.logoutPending')
                  : $t('common.nav.logout')
              }}
            </u-button>
          </template>

          <template v-else>
            <u-button
              icon="i-lucide-log-in"
              variant="outline"
              @click="openAuth('login')"
            >
              {{ $t('common.nav.login') }}
            </u-button>

            <u-button icon="i-lucide-user-plus" @click="openAuth('register')">
              {{ $t('common.nav.register') }}
            </u-button>
          </template>
        </div>
      </div>
    </nav>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps, and where UIDialog hands focus back when the control it was opened from is gone. Neither moves focus without it — a fragment link alone only sets the browser's tab-navigation start point. -->
    <main
      id="main-content"
      class="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto p-4"
      tabindex="-1"
    >
      <slot />
    </main>

    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { useLogOut } from '@/services/queries/useAuthQueries';

import LoginDialog from '@/components/auth/LoginDialog.vue';
import RegisterDialog from '@/components/auth/RegisterDialog.vue';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog.vue';

import type { AuthDialog } from '@/types/auth';

const AUTH_DIALOGS = {
  login: LoginDialog,
  register: RegisterDialog,
  'forgot-password': ForgotPasswordDialog
};

const overlay = useOverlay();

const { isLoggedIn, isAdmin, user } = storeToRefs(useAuthStore());

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
