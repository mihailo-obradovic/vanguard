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
              {{
                isLoggingOut
                  ? $t('common.nav.logoutPending')
                  : $t('common.nav.logout')
              }}
            </button>
          </template>

          <template v-else>
            <NuxtLink to="/login" class="auth-link">
              {{ $t('common.nav.login') }}
            </NuxtLink>

            <NuxtLink to="/register" class="auth-link">
              {{ $t('common.nav.register') }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </nav>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps, and where UIDialog hands focus back when the control it was opened from is gone. Neither moves focus without it — a fragment link alone only sets the browser's tab-navigation start point. -->
    <main id="main-content" class="main-content" tabindex="-1">
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
  background-color: var(--color-border);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name-link {
  text-decoration: none;
  color: var(--color-brand);
  background-color: var(--color-border);
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
