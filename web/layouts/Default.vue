<template>
  <v-layout class="layout">
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

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <TheFooter />

    <RegisterDialog
      v-model="registerDialog"
      :loading="isRegistering"
      @confirm="handleRegister"
    />

    <LoginDialog
      v-model="loginDialog"
      :loading="isLoggingIn"
      @confirm="handleLogin"
      @forgot-password-click="forgotPasswordDialog = true"
    />

    <ForgotPasswordDialog
      v-model="forgotPasswordDialog"
      :loading="isSendingResetEmail"
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
  isSendingResetEmail
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

  const { mutate: handleRegister, isLoading: isRegistering } = useRegister({
    onSuccess: () => {
      registerDialog.value = false;
    }
  });

  const { mutate: handleLogin, isLoading: isLoggingIn } = useLogIn({
    onSuccess: () => {
      loginDialog.value = false;
    }
  });

  const { mutate: handleForgotPassword, isLoading: isSendingResetEmail } =
    useGeneratePasswordResetEmail({
      onSuccess: (data) => {
        $toast(data.status, 'success');
        forgotPasswordDialog.value = false;
      }
    });

  return {
    registerDialog,
    loginDialog,
    forgotPasswordDialog,
    handleRegister,
    handleLogin,
    handleForgotPassword,
    isRegistering,
    isLoggingIn,
    isSendingResetEmail
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
