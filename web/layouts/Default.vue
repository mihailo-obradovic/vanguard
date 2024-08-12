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

        <template v-if="auth.isLoggedIn">
          <v-btn prepend-icon="mdi-account" to="/profile">Profile</v-btn>

          <v-btn prepend-icon="mdi-logout" @click="handleLogout">Log Out</v-btn>
        </template>

        <template v-else>
          <v-btn prepend-icon="mdi-login" to="/login">Log In</v-btn>

          <v-btn prepend-icon="mdi-account-plus" to="/register">Register</v-btn>
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
  </v-layout>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify';

const auth = useAuthStore();

async function handleLogout() {
  await auth.logOut();
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
</script>
