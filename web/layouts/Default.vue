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

      <div class="d-flex pa-2 ga-2">
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

    <v-navigation-drawer v-model="drawer" color="primary">
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
const auth = useAuthStore();

async function handleLogout() {
  await auth.logOut();
}

const drawer = ref(true);

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const drawerItems = [
  { title: 'Auth Only', to: '/auth-only', icon: 'mdi-lock' },
  { title: 'Guest Only', to: '/guest-only', icon: 'mdi-lock-outline' }
];
</script>
