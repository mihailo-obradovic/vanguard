<template>
  <div class="flex h-full flex-col">
    <SkipLink />

    <nav
      class="bg-primary text-primary-foreground flex shrink-0 items-center justify-between gap-4 px-4 py-2"
    >
      <div class="flex items-center gap-2">
        <NuxtLink to="/home" :class="NAV_LINK">
          {{ $t('common.nav.home') }}
        </NuxtLink>

        <NuxtLink v-if="isAdmin" to="/users" :class="NAV_LINK">
          {{ $t('common.nav.users') }}
        </NuxtLink>

        <NuxtLink v-if="isAdmin" to="/graphql-demo" :class="NAV_LINK">
          {{ $t('common.nav.graphqlDemo') }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <ColorModeToggle />

        <LocaleSwitcher />

        <template v-if="isLoggedIn">
          <!-- * Same height as the buttons beside it, so the bar does not resize between the signed-in and guest states. -->
          <NuxtLink
            to="/profile"
            class="bg-primary-foreground/15 hover:bg-primary-foreground/25 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
          >
            {{ user?.name }}
          </NuxtLink>

          <Button
            variant="destructive"
            :disabled="isLoggingOut"
            @click="logOut()"
          >
            <UIReservedLabel
              :variants="{
                idle: $t('common.nav.logout'),
                pending: $t('common.nav.logoutPending')
              }"
              :active="isLoggingOut ? 'pending' : 'idle'"
            />
          </Button>
        </template>

        <template v-else>
          <Button variant="on-primary" @click="openLogin">
            {{ $t('common.nav.login') }}
          </Button>

          <Button variant="on-primary" @click="openRegister">
            {{ $t('common.nav.register') }}
          </Button>
        </template>
      </div>
    </nav>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps. It does not move focus without it — a fragment link alone only sets the browser's tab-navigation start point. -->
    <main
      id="main-content"
      class="mx-auto flex w-full max-w-[1200px] flex-1 flex-col overflow-y-auto p-4"
      tabindex="-1"
    >
      <slot />
    </main>

    <TheFooter />

    <!-- * The three are mutually exclusive, and each closes itself before emitting its hand-off — so a hand-off only has to raise the next one's flag. -->
    <LoginDialog
      v-model="loginDialog"
      :loading="isLoggingIn"
      :server-errors="loginErrors"
      @confirm="handleLogin"
      @forgot-password="openForgotPassword"
      @register="openRegister"
    />

    <RegisterDialog
      v-model="registerDialog"
      :loading="isRegistering"
      :server-errors="registerErrors"
      @confirm="handleRegister"
      @log-in="openLogin"
    />

    <ForgotPasswordDialog
      v-model="forgotPasswordDialog"
      :loading="isSendingResetEmail"
      :server-errors="forgotPasswordErrors"
      @confirm="handleForgotPassword"
      @back-to-login="openLogin"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useGeneratePasswordResetEmail,
  useLogIn,
  useLogOut,
  useRegister
} from '@/services/queries/useAuthQueries';
import { Button } from '@/components/ui/button';
import ForgotPasswordDialog from '@/components/users/ForgotPasswordDialog.vue';
import LoginDialog from '@/components/users/LoginDialog.vue';
import RegisterDialog from '@/components/users/RegisterDialog.vue';

const NAV_LINK =
  'hover:bg-primary-foreground/10 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors';

const { isLoggedIn, isAdmin, user } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut();

const {
  dialog: loginDialog,
  submit: handleLogin,
  loading: isLoggingIn,
  errors: loginErrors
} = useMutationDialog(useLogIn, () => navigateTo('/home'));

const {
  dialog: registerDialog,
  submit: handleRegister,
  loading: isRegistering,
  errors: registerErrors
} = useMutationDialog(useRegister, () => navigateTo('/home'));

const {
  dialog: forgotPasswordDialog,
  submit: handleForgotPassword,
  loading: isSendingResetEmail,
  errors: forgotPasswordErrors
} = useMutationDialog(useGeneratePasswordResetEmail, (data) =>
  $toast(data.status, 'success')
);

function openLogin() {
  loginDialog.value = true;
}

function openRegister() {
  registerDialog.value = true;
}

function openForgotPassword() {
  forgotPasswordDialog.value = true;
}
</script>
