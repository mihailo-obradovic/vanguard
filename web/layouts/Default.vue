<template>
  <v-layout class="layout">
    <SkipLink />

    <v-app-bar color="primary" class="px-2">
      <template #prepend>
        <v-app-bar-nav-icon @click="toggleDrawer" />

        <v-btn icon to="/" class="ms-2">
          <v-icon :icon="mdiHome" />
        </v-btn>
      </template>

      <v-app-bar-title class="user-select-none"> Vanguard </v-app-bar-title>

      <v-spacer />

      <div class="d-flex align-center pa-2 ga-2">
        <v-btn icon @click="toggleTheme">
          <v-icon
            :icon="isDark ? mdiMoonWaxingCrescent : mdiWhiteBalanceSunny"
          />
        </v-btn>

        <template v-if="isLoggedIn">
          <v-btn :prepend-icon="mdiAccount" to="/profile">Profile</v-btn>

          <v-btn
            :loading="isLoggingOut"
            :prepend-icon="mdiLogout"
            @click="handleLogout"
          >
            Log Out
          </v-btn>
        </template>

        <template v-else>
          <v-btn :prepend-icon="mdiLogin" @click="loginDialog = true">
            Log In
          </v-btn>

          <v-btn :prepend-icon="mdiAccountPlus" @click="registerDialog = true">
            Register
          </v-btn>
        </template>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" color="secondary">
      <v-list>
        <v-list-item
          v-for="(item, index) in drawerItems"
          :key="index"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main id="main-content">
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <TheFooter />

    <RegisterDialog
      v-model="registerDialog"
      :loading="isRegistering"
      :server-errors="registerErrors"
      @confirm="handleRegister"
    />

    <LoginDialog
      v-model="loginDialog"
      :loading="isLoggingIn"
      :server-errors="loginErrors"
      @confirm="handleLogin"
      @forgot-password-click="forgotPasswordDialog = true"
    />

    <ForgotPasswordDialog
      v-model="forgotPasswordDialog"
      :loading="isSendingResetEmail"
      :server-errors="forgotPasswordErrors"
      @confirm="handleForgotPassword"
    />
  </v-layout>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';
import {
  mdiAccount,
  mdiAccountMultiple,
  mdiAccountPlus,
  mdiHome,
  mdiLogin,
  mdiLogout,
  mdiMoonWaxingCrescent,
  mdiWhiteBalanceSunny
} from '@mdi/js';

import RegisterDialog from '@/components/users/RegisterDialog.vue';
import LoginDialog from '@/components/users/LoginDialog.vue';
import ForgotPasswordDialog from '@/components/users/ForgotPasswordDialog.vue';

import {
  useRegister,
  useLogIn,
  useLogOut,
  useGeneratePasswordResetEmail
} from '@/services/queries/useAuthQueries';

const { isLoggedIn, isAdmin } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut({
  onSuccess: () => navigateTo('/')
});

function handleLogout() {
  logOut();
}

const drawer = ref(true);

const drawerItems = computed(() => [
  { title: 'Profile', to: '/profile', icon: mdiAccount },
  ...(isAdmin.value
    ? [{ title: 'Users', to: '/users', icon: mdiAccountMultiple }]
    : [])
]);

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const { isDark, toggleTheme } = useThemeSwitching();

const {
  registerDialog,
  loginDialog,
  forgotPasswordDialog,
  handleRegister,
  handleLogin,
  handleForgotPassword,
  isRegistering,
  isLoggingIn,
  isSendingResetEmail,
  loginErrors,
  registerErrors,
  forgotPasswordErrors
} = useUserDialogs();

function useThemeSwitching() {
  const theme = useTheme();

  const isDark = computed(() => theme.global.current.value.dark);

  function toggleTheme() {
    theme.toggle();
  }

  const themeSetting = useCookie('theme');

  watch(isDark, (value) => {
    themeSetting.value = value ? 'dark' : 'light';
  });

  onMounted(() => {
    theme.change(themeSetting.value || 'light');
  });

  return { isDark, toggleTheme };
}

function useUserDialogs() {
  const registerDialog = ref(false);
  const loginDialog = ref(false);
  const forgotPasswordDialog = ref(false);

  const {
    mutate: handleRegister,
    isLoading: isRegistering,
    error: registerError
  } = useRegister({
    errorHandling: { hideValidationToast: true },
    onSuccess: () => {
      registerDialog.value = false;
    }
  });

  const registerErrors = useValidationErrors(registerError);

  const {
    mutate: handleLogin,
    isLoading: isLoggingIn,
    error: loginError
  } = useLogIn({
    errorHandling: { hideValidationToast: true },
    onSuccess: () => {
      loginDialog.value = false;
    }
  });

  const loginErrors = useValidationErrors(loginError);

  const {
    mutate: handleForgotPassword,
    isLoading: isSendingResetEmail,
    error: forgotPasswordError
  } = useGeneratePasswordResetEmail({
    errorHandling: { hideValidationToast: true },
    onSuccess: (data) => {
      $toast(data.status, 'success');
      forgotPasswordDialog.value = false;
    }
  });

  const forgotPasswordErrors = useValidationErrors(forgotPasswordError);

  return {
    registerDialog,
    loginDialog,
    forgotPasswordDialog,
    handleRegister,
    handleLogin,
    handleForgotPassword,
    isRegistering,
    isLoggingIn,
    isSendingResetEmail,
    loginErrors,
    registerErrors,
    forgotPasswordErrors
  };
}
</script>

<style lang="scss" scoped>
.layout {
  height: 100%;
  width: 100%;
  background: rgb(var(--v-theme-background));
}
</style>
