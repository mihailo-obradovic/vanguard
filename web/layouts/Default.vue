<template>
  <v-layout>
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

    <LoginDialog v-model="loginDialog" @confirm="handleLogin" />

    <RegisterDialog v-model="registerDialog" @confirm="handleRegister" />
  </v-layout>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify';

import LoginDialog from '@/components/users/LoginDialog.vue';
import RegisterDialog from '@/components/users/RegisterDialog.vue';

import type { LoginForm, RegistrationForm } from '@/types/auth';

const { isLoggedIn } = storeToRefs(useAuthStore());
const { logOut } = useAuthStore();
const { isLoading } = storeToRefs(useLoading());
const { $startLoading, $stopLoading } = useLoading();

async function handleLogout() {
  $startLoading();

  logOut().finally(() => {
    $stopLoading();
  });
}

const drawer = ref(true);

const drawerItems = [
  { title: 'Auth Only', to: '/auth-only', icon: 'mdi-lock' },
  { title: 'Guest Only', to: '/guest-only', icon: 'mdi-lock-outline' }
];

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const { isDark, toggleTheme } = useThemeSwitching();

const { loginDialog, registerDialog, handleLogin, handleRegister } =
  useUserDialogs();

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
  const loginDialog = ref(false);
  const registerDialog = ref(false);

  const { logIn, register } = useAuthStore();

  function handleLogin(form: LoginForm) {
    $startLoading();

    logIn(form)
      .then(() => {
        loginDialog.value = false;

        navigateTo('/');
      })
      .finally(() => {
        $stopLoading();
      });
  }

  function handleRegister(form: RegistrationForm) {
    $startLoading();

    register(form)
      .then(() => {
        registerDialog.value = false;

        navigateTo('/');
      })
      .finally(() => {
        $stopLoading();
      });
  }

  return { loginDialog, registerDialog, handleLogin, handleRegister };
}
</script>
