<template>
  <!-- * The shell is exactly the viewport's height and never scrolls itself — `main` is the one scrolling region, which is what keeps the header, sidebar and footer in place. `main.css` pins html/body/#__nuxt to 100% with overflow hidden for the same reason. -->
  <div class="flex h-full flex-col">
    <SkipLink />

    <!-- * The branded bar, as on the vuetify variant. `text-inverted` is the colour Nuxt UI puts on a solid primary fill, so every control inside inherits it rather than restating white. -->
    <header
      class="bg-primary text-inverted flex h-14 shrink-0 items-center gap-1 px-2"
    >
      <u-button
        icon="i-lucide-menu"
        :aria-label="$t('common.nav.toggleMenu')"
        v-bind="CHROME"
        @click="toggleDrawer"
      />

      <u-button
        to="/home"
        icon="i-lucide-house"
        :aria-label="$t('common.nav.home')"
        v-bind="CHROME"
      />

      <span class="ms-1 text-lg font-bold select-none">Vanguard</span>

      <div class="flex-1" />

      <u-color-mode-button
        :aria-label="$t('common.nav.colorMode')"
        v-bind="CHROME"
      />

      <LocaleSwitcher />

      <AuthControls />
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- * Pushes the content aside from `lg` up, the way the vuetify drawer does; below that the same links come in through the slideover instead. A muted surface rather than `bg-secondary`: on this palette secondary is Dracula's pink, where the vuetify drawer's secondary is its grey — `bg-elevated` is the token that actually means "a shade off the page". -->
      <aside
        v-if="desktopDrawer"
        class="bg-default border-default hidden w-56 shrink-0 overflow-y-auto border-e p-2 lg:block"
      >
        <SidebarNav />
      </aside>

      <!-- ! A separate flag from the aside's, not the same one behind a CSS class: a slideover left open is a live modal, and it would keep the whole app aria-hidden and focus-trapped on desktop while `hidden` merely stopped it being drawn. -->
      <u-slideover
        v-model:open="mobileDrawer"
        side="left"
        :title="$t('common.nav.menu')"
        :ui="{ content: 'max-w-64' }"
      >
        <template #body>
          <SidebarNav @navigate="mobileDrawer = false" />
        </template>
      </u-slideover>

      <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps. A fragment link alone only sets the browser's tab-navigation start point, so without it the jump moves nothing. -->
      <main
        id="main-content"
        class="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col overflow-y-auto p-4"
        tabindex="-1"
      >
        <slot />
      </main>
    </div>

    <u-footer
      class="bg-default border-default border-t"
      :ui="{ container: 'max-w-6xl py-4 lg:py-4' }"
    >
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

// * Every control on the branded bar looks the same: ghost so the bar's own colour shows through, and inheriting its text colour rather than the neutral one.
const CHROME = {
  color: 'neutral',
  variant: 'ghost',
  class: 'text-inverted hover:bg-inverted/10'
} as const;

const currentYear = Temporal.Now.plainDateISO().year;

// * Matches the `lg` breakpoint the aside is shown at, so the toggle always drives whichever of the two is actually on screen.
const isDesktop = useMediaQuery('(min-width: 1024px)');

// * Open by default, as the vuetify drawer is. The aside is CSS-hidden below `lg`, so it costs nothing there.
const desktopDrawer = ref(true);

const mobileDrawer = ref(false);

function toggleDrawer() {
  if (isDesktop.value) {
    desktopDrawer.value = !desktopDrawer.value;

    return;
  }

  mobileDrawer.value = !mobileDrawer.value;
}
</script>
