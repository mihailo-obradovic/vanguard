<template>
  <v-layout class="layout">
    <SkipLink />

    <v-app-bar color="primary" class="px-2">
      <template #prepend>
        <v-app-bar-nav-icon
          :aria-label="$t('common.nav.toggleMenu')"
          @click="toggleDrawer"
        />

        <v-btn :aria-label="$t('common.nav.home')" icon to="/" class="ms-2">
          <v-icon :icon="mdiHome" />
        </v-btn>
      </template>

      <v-app-bar-title class="user-select-none"> Vanguard </v-app-bar-title>

      <v-spacer />

      <div class="d-flex align-center pa-2 ga-2">
        <LocaleSwitcher />

        <v-btn
          :aria-label="$t('common.nav.toggleTheme')"
          icon
          @click="toggleTheme"
        >
          <v-icon
            :icon="isDark ? mdiMoonWaxingCrescent : mdiWhiteBalanceSunny"
          />
        </v-btn>

        <template v-if="isLoggedIn">
          <v-btn :prepend-icon="mdiAccount" to="/profile">
            {{ $t('common.nav.profile') }}
          </v-btn>

          <v-btn
            :loading="isLoggingOut"
            :prepend-icon="mdiLogout"
            @click="handleLogout"
          >
            {{ $t('common.nav.logout') }}
          </v-btn>
        </template>

        <template v-else>
          <v-btn :prepend-icon="mdiLogin" @click="loginDialog = true">
            {{ $t('common.nav.login') }}
          </v-btn>

          <v-btn :prepend-icon="mdiAccountPlus" @click="registerDialog = true">
            {{ $t('common.nav.register') }}
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
      <v-container fluid class="page-container">
        <slot />
      </v-container>
    </v-main>

    <TheFooter />

    <!-- * The three are mutually exclusive, and each closes itself before emitting its hand-off — so a hand-off only has to raise the next one's flag. -->
    <RegisterDialog
      v-model="registerDialog"
      :loading="isRegistering"
      :server-errors="registerErrors"
      @confirm="handleRegister"
      @log-in-click="loginDialog = true"
    />

    <LoginDialog
      v-model="loginDialog"
      :loading="isLoggingIn"
      :server-errors="loginErrors"
      @confirm="handleLogin"
      @forgot-password-click="forgotPasswordDialog = true"
      @register-click="registerDialog = true"
    />

    <ForgotPasswordDialog
      v-model="forgotPasswordDialog"
      :loading="isSendingResetEmail"
      :server-errors="forgotPasswordErrors"
      @confirm="handleForgotPassword"
      @back-to-login-click="loginDialog = true"
    />
  </v-layout>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';
import {
  mdiAccount,
  mdiAccountMultiple,
  mdiAccountPlus,
  mdiGraphql,
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

const { t } = useI18n();

const { isLoggedIn, isAdmin } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut({
  onSuccess: () => navigateTo('/')
});

function handleLogout() {
  logOut();
}

const drawer = ref(true);

const drawerItems = computed(() => [
  { title: t('common.nav.profile'), to: '/profile', icon: mdiAccount },
  ...(isAdmin.value
    ? [
        {
          title: t('common.nav.users'),
          to: '/users',
          icon: mdiAccountMultiple
        },
        {
          title: t('common.nav.graphqlDemo'),
          to: '/graphql-demo',
          icon: mdiGraphql
        }
      ]
    : [])
]);

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const { isDark, toggleTheme } = useThemeSwitching();

const {
  dialog: registerDialog,
  submit: handleRegister,
  loading: isRegistering,
  errors: registerErrors
} = useMutationDialog(useRegister);

const {
  dialog: loginDialog,
  submit: handleLogin,
  loading: isLoggingIn,
  errors: loginErrors
} = useMutationDialog(useLogIn);

const {
  dialog: forgotPasswordDialog,
  submit: handleForgotPassword,
  loading: isSendingResetEmail,
  errors: forgotPasswordErrors
} = useMutationDialog(useGeneratePasswordResetEmail, (data) =>
  $toast(data.status, 'success')
);

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
</script>

<style lang="scss" scoped>
@use 'vuetify/settings';

.layout {
  height: 100%;
  width: 100%;
  background: rgb(var(--v-theme-background));
}

/* * The page's own bottom gap, published to descendants so a full-height child can subtract it.
   Vuetify's own padding is the shorthand `padding: $container-padding-x`, so restate the bottom
   from the variable — the gap and the value handed down can never disagree. */
.page-container {
  --page-padding-bottom: #{settings.$container-padding-x};

  padding-bottom: var(--page-padding-bottom);
}
</style>
