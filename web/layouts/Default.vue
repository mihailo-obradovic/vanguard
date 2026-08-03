<template>
  <div class="layout">
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-links">
          <NuxtLink to="/home" class="nav-link">Home</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/users" class="nav-link">Users</NuxtLink>
        </div>

        <div class="nav-auth">
          <template v-if="isLoggedIn">
            <NuxtLink to="/profile" class="user-name-link">
              {{ user?.name }}
            </NuxtLink>
            <button
              class="logout-btn"
              :disabled="isLoggingOut"
              @click="logOut()"
            >
              {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="auth-link">Login</NuxtLink>
            <NuxtLink to="/register" class="auth-link">Register</NuxtLink>
          </template>
        </div>
      </div>
    </nav>

    <main id="main-content" class="main-content">
      <slot />
    </main>

    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { useLogOut } from '@/services/queries/useAuthQueries';

const { isLoggedIn, isAdmin, user } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut();
</script>

<style scoped>
/* Visually hidden until focused, so keyboard users can jump past the navbar. */
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 2000;
  background-color: white;
  color: rgb(0, 102, 255);
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}

.skip-link:focus {
  left: 16px;
  top: 16px;
}

.navbar {
  background-color: rgb(0, 102, 255);
  border-bottom: 1px solid #000000;
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
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: rgb(0, 102, 255);
  background-color: #e9ecef;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name-link {
  text-decoration: none;
  color: rgb(0, 102, 255);
  background-color: #e9ecef;
  padding: 8px 16px;
  /* Transparent border matches .auth-link so the navbar height doesn't
     change between logged-in and logged-out states. */
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.25s ease;
  font-weight: 500;
}

.user-name-link:hover {
  color: white;
  background-color: #c82333;
}

.logout-btn {
  font-family: 'Lexend', sans-serif;
  background-color: #dc3545;
  color: white;
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;
  font-size: 16px;
  line-height: normal;
}

.logout-btn:hover {
  background-color: #c82333;
}

.auth-link {
  text-decoration: none;
  color: #ffffff;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.auth-link:hover {
  background-color: white;
  color: rgb(0, 102, 255);
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
