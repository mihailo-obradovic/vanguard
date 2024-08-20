<template>
  <v-layout class="layout">
    <v-app-bar color="primary" class="px-2">
      <template #prepend>
        <v-app-bar-nav-icon @click="toggleDrawer" />

        <v-btn icon to="/" class="ms-2">
          <v-icon>mdi-home</v-icon>
        </v-btn>
      </template>

      <v-app-bar-title class="user-select-none">
        Laravel Nuxt Template
      </v-app-bar-title>

      <v-spacer />

      <div class="d-flex align-center pa-2 ga-2">
        <v-btn icon @click="toggleTheme">
          <v-icon>
            {{
              isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waxing-crescent'
            }}
          </v-icon>
        </v-btn>

        <template v-if="isLoggedIn">
          <v-btn prepend-icon="mdi-account" to="/profile">Profile</v-btn>

          <v-btn
            :loading="isLoading"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            Log Out
          </v-btn>
        </template>

        <template v-else>
          <v-btn prepend-icon="mdi-login" @click="loginDialog = true">
            Log In
          </v-btn>

          <v-btn prepend-icon="mdi-account-plus" @click="registerDialog = true">
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

import RegisterDialog from '@/components/users/RegisterDialog.vue';
import LoginDialog from '@/components/users/LoginDialog.vue';
import ForgotPasswordDialog from '~/components/users/ForgotPasswordDialog.vue';

import useAuthService from '@/services/useAuthService';

import type { LoginForm, RegistrationForm } from '@/types/auth';

const { isLoggedIn } = storeToRefs(useAuthStore());
const { isLoading } = storeToRefs(useLoadingStore());

const { $startLoading, $stopLoading } = useLoadingStore();

const { logOut } = useAuthService();

async function handleLogout() {
  $startLoading();

  logOut()
    .then(() => {
      navigateTo('/');
    })
    .catch(console.error)
    .finally($stopLoading);
}

const drawer = ref(true);

const drawerItems = [{ title: 'Profile', to: '/profile', icon: 'mdi-account' }];

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
    theme.global.name.value = isDark.value ? 'light' : 'dark';
  }

  const themeSetting = useCookie('theme');

  watch(isDark, (value) => {
    themeSetting.value = value ? 'dark' : 'light';
  });

  onMounted(() => {
    theme.global.name.value = themeSetting.value || 'light';
  });

  return { isDark, toggleTheme };
}

function useUserDialogs() {
  const registerDialog = ref(false);
  const loginDialog = ref(false);
  const forgotPasswordDialog = ref(false);

  const { register, logIn, forgotPassword } = useAuthService();

  function handleRegister(form: RegistrationForm) {
    $startLoading();

    register(form)
      .then(() => {
        registerDialog.value = false;

        navigateTo('/');
      })
      .catch(console.error)
      .finally($stopLoading);
  }

  function handleLogin(form: LoginForm) {
    $startLoading();

    logIn(form)
      .then(() => {
        loginDialog.value = false;

        navigateTo('/');
      })
      .catch(console.error)
      .finally($stopLoading);
  }

  function handleForgotPassword(form: { email: string }) {
    $startLoading();

    forgotPassword(form)
      .then(() => {
        forgotPasswordDialog.value = false;
      })
      .catch(console.error)
      .finally($stopLoading);
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
