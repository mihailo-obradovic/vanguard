<template>
  <!-- * The shell is exactly the viewport's height and never scrolls itself — `main` is the one scrolling region, which is what keeps the header and footer in place. `main.css` pins html/body/#__nuxt to 100% with overflow hidden for the same reason; a `min-h-*` shell here would be clipped by that instead of scrolling. -->
  <div class="flex h-full flex-col">
    <SkipLink />

    <!-- ! `menu` names the mobile menu's dialog. Without it Nuxt UI's own untranslated keys
         ! ("header.title") reach the accessibility tree, leaving the menu with no accessible name. -->
    <u-header
      title="Vanguard"
      to="/home"
      :menu="{ title: $t('common.nav.menu'), description: '' }"
      :ui="{ container: 'max-w-6xl' }"
    >
      <template #default>
        <nav class="flex items-center gap-1">
          <u-button
            v-for="link in links"
            :key="link.to"
            v-bind="link"
            variant="ghost"
            color="neutral"
            active-variant="soft"
          />
        </nav>
      </template>

      <template #right>
        <!-- * Nuxt UI's own toggle over @nuxtjs/color-mode, which @nuxt/ui registers; it reads and writes the preference cookie itself, so there is no hand-rolled theme switching to keep. -->
        <u-color-mode-button :aria-label="$t('common.nav.colorMode')" />

        <LocaleSwitcher />

        <div class="hidden items-center gap-1.5 lg:flex">
          <AuthControls />
        </div>
      </template>

      <!-- * The mobile menu the header opens below `lg`, where its centre slot is hidden. Without it the nav links and the session controls would simply be unreachable on a phone. -->
      <template #body>
        <div class="flex flex-col gap-2">
          <u-button
            v-for="link in links"
            :key="link.to"
            v-bind="link"
            variant="ghost"
            color="neutral"
            active-variant="soft"
            block
            class="justify-start"
          />

          <AuthControls block />
        </div>
      </template>
    </u-header>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps. A fragment link alone only sets the browser's tab-navigation start point, so without it the jump moves nothing. -->
    <main
      id="main-content"
      class="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto p-4"
      tabindex="-1"
    >
      <slot />
    </main>

    <u-footer :ui="{ container: 'max-w-6xl py-4 lg:py-4' }">
      <template #left>
        <span class="text-muted text-sm">
          {{ $t('common.footer.copyright', { year: currentYear }) }}
        </span>
      </template>
    </u-footer>
  </div>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

import AuthControls from '@/components/_shared/AuthControls.vue';

const { t } = useI18n();

const { isAdmin } = storeToRefs(useAuthStore());

const currentYear = Temporal.Now.plainDateISO().year;

const links = computed(() => [
  { to: '/home', icon: 'i-lucide-house', label: t('common.nav.home') },
  ...(isAdmin.value
    ? [
        { to: '/users', icon: 'i-lucide-users', label: t('common.nav.users') },
        {
          to: '/graphql-demo',
          icon: 'i-lucide-braces',
          label: t('common.nav.graphqlDemo')
        }
      ]
    : [])
]);
</script>
