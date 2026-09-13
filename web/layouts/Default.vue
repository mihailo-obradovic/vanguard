<template>
  <div class="flex h-full flex-col">
    <SkipLink />

    <nav
      class="bg-primary text-primary-foreground flex shrink-0 items-center justify-between gap-4 px-4 py-2"
    >
      <!-- * Below `lg` the links and the auth controls move into a drawer. Signed in as an admin, the inline bar needs 732px in English and 779px in Serbian Cyrillic, so `md` (768px) would still overflow. -->
      <Sheet v-model:open="drawer">
        <SheetTrigger as-child>
          <Button
            ref="menuButton"
            variant="on-primary"
            size="icon"
            class="lg:hidden"
            :aria-label="$t('common.nav.menu')"
          >
            <Menu />
          </Button>
        </SheetTrigger>

        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{{ $t('common.nav.menu') }}</SheetTitle>
          </SheetHeader>

          <nav class="flex flex-col gap-1 px-4">
            <Button
              v-for="link in links"
              :key="link.to"
              variant="ghost"
              class="justify-start"
              as-child
            >
              <NuxtLink :to="link.to">
                {{ $t(link.label) }}
              </NuxtLink>
            </Button>
          </nav>

          <Separator />

          <div v-if="isLoggedIn" class="flex flex-col gap-2 px-4">
            <Button variant="ghost" class="justify-start" as-child>
              <NuxtLink to="/profile">
                {{ user?.name }}
              </NuxtLink>
            </Button>

            <Button
              variant="destructive"
              :disabled="isLoggingOut"
              @click="logOutFromDrawer"
            >
              <UIReservedLabel
                :variants="{
                  idle: $t('common.nav.logout'),
                  pending: $t('common.nav.logoutPending')
                }"
                :active="isLoggingOut ? 'pending' : 'idle'"
              />
            </Button>
          </div>

          <div v-else class="flex flex-col gap-2 px-4">
            <Button @click="openLoginFromDrawer">
              {{ $t('common.nav.login') }}
            </Button>

            <Button variant="outline" @click="openRegisterFromDrawer">
              {{ $t('common.nav.register') }}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div class="hidden items-center gap-2 lg:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="NAV_LINK"
        >
          {{ $t(link.label) }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <ColorModeToggle />

        <LocaleSwitcher />

        <div v-if="isLoggedIn" class="hidden items-center gap-3 lg:flex">
          <!-- * Same height as the buttons beside it, so the bar does not resize between the signed-in and guest states. -->
          <!-- ! Any tint of the bar's foreground pulls the text towards its own colour: 5% rest and 10% hover hold 5.33:1 and 4.82:1 in the light face, where 15% and 25% fell to 4.36:1 and 3.56:1. -->
          <NuxtLink
            to="/profile"
            class="bg-primary-foreground/5 hover:bg-primary-foreground/10 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
          >
            {{ user?.name }}
          </NuxtLink>

          <!-- ! The vendored destructive button pairs white with a 60% fill in the dark face, which is measured against the dark page. Over this lavender bar it falls to 3.01:1, so here it takes the full fill and the bar's dark text: 4.53:1, 4.54:1 on hover. -->
          <Button
            variant="destructive"
            class="dark:bg-destructive dark:text-primary-foreground dark:hover:bg-destructive/90"
            :disabled="isLoggingOut"
            @click="logOut()"
          >
            <UIReservedLabel
              :variants="{
                idle: $t('common.nav.logout'),
                pending: $t('common.nav.logoutPending')
              }"
              :active="isLoggingOut ? 'pending' : 'idle'"
            />
          </Button>
        </div>

        <div v-else class="hidden items-center gap-3 lg:flex">
          <Button variant="on-primary" @click="startLogin">
            {{ $t('common.nav.login') }}
          </Button>

          <Button variant="on-primary" @click="startRegister">
            {{ $t('common.nav.register') }}
          </Button>
        </div>
      </div>
    </nav>

    <!-- * `tabindex="-1"` makes the landmark programmatically focusable: it is where SkipLink jumps. It does not move focus without it — a fragment link alone only sets the browser's tab-navigation start point. -->
    <main
      id="main-content"
      class="mx-auto flex w-full max-w-[1200px] flex-1 flex-col overflow-y-auto p-4"
      tabindex="-1"
    >
      <slot />
    </main>

    <TheFooter />

    <!-- * `return-focus-to` falls through to each dialog's FormDialog: the control that started the chain, so a hand-off or a drawer that has since closed does not leave focus on <body>. -->
    <!-- * The three are mutually exclusive, and each closes itself before emitting its hand-off — so a hand-off only has to raise the next one's flag. -->
    <LoginDialog
      :return-focus-to="focusOrigin"
      v-model="loginDialog"
      :loading="isLoggingIn"
      :server-errors="loginErrors"
      @confirm="handleLogin"
      @forgot-password="openForgotPassword"
      @register="openRegister"
    />

    <RegisterDialog
      :return-focus-to="focusOrigin"
      v-model="registerDialog"
      :loading="isRegistering"
      :server-errors="registerErrors"
      @confirm="handleRegister"
      @log-in="openLogin"
    />

    <ForgotPasswordDialog
      :return-focus-to="focusOrigin"
      v-model="forgotPasswordDialog"
      :loading="isSendingResetEmail"
      :server-errors="forgotPasswordErrors"
      @confirm="handleForgotPassword"
      @back-to-login="openLogin"
    />
  </div>
</template>

<script setup lang="ts">
import { Menu } from '@lucide/vue';

import {
  useGeneratePasswordResetEmail,
  useLogIn,
  useLogOut,
  useRegister
} from '@/services/queries/useAuthQueries';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import ForgotPasswordDialog from '@/components/users/ForgotPasswordDialog.vue';
import LoginDialog from '@/components/users/LoginDialog.vue';
import RegisterDialog from '@/components/users/RegisterDialog.vue';

import type { ComponentPublicInstance } from 'vue';

const NAV_LINK =
  'hover:bg-primary-foreground/10 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors';

const menuButton = useTemplateRef<ComponentPublicInstance>('menuButton');

const route = useRoute();

const { isLoggedIn, isAdmin, user } = storeToRefs(useAuthStore());

const { mutate: logOut, isLoading: isLoggingOut } = useLogOut();

const {
  dialog: loginDialog,
  submit: handleLogin,
  loading: isLoggingIn,
  errors: loginErrors
} = useMutationDialog(useLogIn, () => navigateTo('/home'));

const {
  dialog: registerDialog,
  submit: handleRegister,
  loading: isRegistering,
  errors: registerErrors
} = useMutationDialog(useRegister, () => navigateTo('/home'));

const {
  dialog: forgotPasswordDialog,
  submit: handleForgotPassword,
  loading: isSendingResetEmail,
  errors: forgotPasswordErrors
} = useMutationDialog(useGeneratePasswordResetEmail, (data) =>
  $toast(data.status, 'success')
);

// * One list for both renderings — inline at `lg`, in the drawer below it — so the two cannot drift apart.
const links = computed(() => [
  { to: '/home', label: 'common.nav.home' },
  ...(isAdmin.value
    ? [
        { to: '/users', label: 'common.nav.users' },
        { to: '/graphql-demo', label: 'common.nav.graphqlDemo' }
      ]
    : [])
]);

// * The control that opened the current chain of auth dialogs. A hand-off keeps it; only a fresh start from the bar or the drawer replaces it.
const focusOrigin = shallowRef<HTMLElement | null>(null);

function startLogin(event: MouseEvent) {
  focusOrigin.value = event.currentTarget as HTMLElement;
  openLogin();
}

function startRegister(event: MouseEvent) {
  focusOrigin.value = event.currentTarget as HTMLElement;
  openRegister();
}

function openLogin() {
  loginDialog.value = true;
}

function openRegister() {
  registerDialog.value = true;
}

function openForgotPassword() {
  forgotPasswordDialog.value = true;
}

const drawer = ref(false);

// * Each action closes the drawer before it starts, so the drawer never sits open behind the dialog it handed off to, or over a session that just ended.
function openLoginFromDrawer() {
  drawer.value = false;
  focusOrigin.value = menuButton.value?.$el ?? null;
  openLogin();
}

function openRegisterFromDrawer() {
  drawer.value = false;
  focusOrigin.value = menuButton.value?.$el ?? null;
  openRegister();
}

function logOutFromDrawer() {
  drawer.value = false;
  logOut();
}

// * Covers every link in the drawer, and a redirect the drawer did not start (a session expiring mid-visit).
watch(
  () => route.fullPath,
  () => {
    drawer.value = false;
  }
);
</script>
