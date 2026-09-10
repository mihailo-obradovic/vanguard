<template>
  <div class="layout">
    <SkipLink />

    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-links">
          <NuxtLink to="/home" class="nav-link">
            {{ $t('common.nav.home') }}
          </NuxtLink>

          <NuxtLink v-if="isAdmin" to="/users" class="nav-link">
            {{ $t('common.nav.users') }}
          </NuxtLink>

          <NuxtLink v-if="isAdmin" to="/graphql-demo" class="nav-link">
            {{ $t('common.nav.graphqlDemo') }}
          </NuxtLink>
        </div>

        <div class="nav-auth">
          <LocaleSwitcher />

          <template v-if="isLoggedIn">
            <NuxtLink to="/profile" class="user-name-link">
              {{ user?.name }}
            </NuxtLink>

            <button
              class="logout-btn"
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
            </button>
          </template>

          <template v-else>
            <button type="button" class="auth-link" @click="openLogin">
              {{ $t('common.nav.login') }}
            </button>

            <button type="button" class="auth-link" @click="openRegister">
              {{ $t('common.nav.register') }}
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps, and where UIDialog hands focus back when the control it was opened from is gone. Neither moves focus without it — a fragment link alone only sets the browser's tab-navigation start point. -->
    <main id="main-content" class="main-content" tabindex="-1">
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
import ForgotPasswordDialog from '@/components/users/ForgotPasswordDialog.vue';
import LoginDialog from '@/components/users/LoginDialog.vue';
import RegisterDialog from '@/components/users/RegisterDialog.vue';

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

<style scoped>
.navbar {
  background-color: var(--color-brand);
  border-bottom: 1px solid var(--color-rule);
  padding: 8px;
}

.nav-container {
  padding: 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  text-decoration: none;
  color: var(--color-on-brand);
  padding: 8px 16px;
  border-radius: var(--radius);
  transition: all var(--transition);
}

.nav-link:hover {
  color: var(--color-brand);
  background-color: var(--color-border-legacy);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name-link {
  text-decoration: none;
  color: var(--color-brand);
  background-color: var(--color-border-legacy);
  padding: 8px 16px;
  /* * Transparent border matches .auth-link so the navbar height doesn't change between logged-in and logged-out states. */
  border: 1px solid transparent;
  border-radius: var(--radius);
  transition: all var(--transition);
  font-weight: 500;
}

.user-name-link:hover {
  color: var(--color-on-brand);
  background-color: var(--color-danger-hover);
}

.logout-btn {
  font-family: 'Lexend', sans-serif;
  background-color: var(--color-danger);
  color: var(--color-on-brand);
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color var(--transition);
  font-size: 16px;
  line-height: normal;
}

.logout-btn:hover {
  background-color: var(--color-danger-hover);
}

.auth-link {
  /* * Was a `<NuxtLink>`; now opens a dialog instead of navigating, so it is a `<button>` — these reset it back to link-like chrome. */
  background: none;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
  color: var(--color-on-brand);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-on-brand);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.auth-link:hover {
  background-color: var(--color-surface);
  color: var(--color-brand);
}

.main-content {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  overflow-y: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
