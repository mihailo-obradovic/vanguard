<template>
  <v-layout class="layout">
    <v-app-bar color="primary" class="px-2">
      <template #prepend>
        <v-app-bar-nav-icon @click="toggleDrawer" />

        <v-btn icon to="/" class="ms-2">
          <v-icon :icon="mdiHome" />
        </v-btn>
      </template>

      <v-app-bar-title class="user-select-none">
        Vanguard
      </v-app-bar-title>

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
            :loading="isLoading['logout']"
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

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <TheFooter />

    <RegisterDialog v-model="registerDialog" @confirm="handleRegister" />

    <LoginDialog
      v-model="loginDialog"
      @confirm="handleLogin"
      @forgot-password-click="forgotPasswordDialog = true"
    />

    <ForgotPasswordDialog
      v-model="forgotPasswordDialog"
      @confirm="handleForgotPassword"
    />
  </v-layout>
</template>

<script lang="ts" setup>
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
  register,
  logIn,
  generatePasswordResetEmail,
  logOut
} from '@/services/auth.api';

import type { Credentials, RegistrationForm } from '@/types/auth';

const { isLoggedIn } = storeToRefs(useAuthStore());
const { isLoading } = storeToRefs(useLoadingStore());

const { $startLoading, $stopLoading } = useLoadingStore();

async function handleLogout() {
  $startLoading('logout');

  logOut()
    .then(() => {
      navigateTo('/');
    })
    .catch(console.error)
    .finally(() => $stopLoading('logout'));
}

const drawer = ref(true);

const drawerItems = [
  { title: 'Profile', to: '/profile', icon: mdiAccount },
  { title: 'Users', to: '/users', icon: mdiAccountMultiple }
];

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
  handleForgotPassword
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

  function handleRegister(form: RegistrationForm) {
    $startLoading('dialog');

    register(form)
      .then(() => {
        registerDialog.value = false;
      })
      .catch(console.error)
      .finally(() => $stopLoading('dialog'));
  }

  function handleLogin(form: Credentials) {
    $startLoading('dialog');

    logIn(form)
      .then(() => {
        loginDialog.value = false;
      })
      .catch(console.error)
      .finally(() => $stopLoading('dialog'));
  }

  function handleForgotPassword(form: { email: string }) {
    $startLoading('dialog');

    generatePasswordResetEmail(form)
      .then(() => {
        forgotPasswordDialog.value = false;
      })
      .catch(console.error)
      .finally(() => $stopLoading('dialog'));
  }

  return {
    registerDialog,
    loginDialog,
    forgotPasswordDialog,
    handleRegister,
    handleLogin,
    handleForgotPassword
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
