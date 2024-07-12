<template>
  <!-- <pre>{{ auth.user }}</pre> -->

  <div>
    <UHorizontalNavigation :links="links" :ui="ui" />

    <slot />
  </div>
</template>

<script lang="ts" setup>
const auth = useAuthStore();

async function handleLogout() {
  await auth.logOut();
}

const links = computed(() => {
  const baseLinks: Array<
    Array<{ label: string; to?: string; icon: string; click?: () => void }>
  > = [
    [
      {
        label: 'Home',
        to: '/home',
        icon: 'i-mdi-home'
      },
      {
        label: 'Auth Only',
        to: '/auth-only',
        icon: 'i-mdi-lock'
      },
      {
        label: 'Guest Only',
        to: '/guest-only',
        icon: 'i-mdi-lock'
      }
    ]
  ];

  if (!auth.isLoggedIn) {
    baseLinks.push([
      {
        label: 'Register',
        to: '/register',
        icon: 'i-mdi-account-plus'
      },
      {
        label: 'Login',
        to: '/login',
        icon: 'i-mdi-login'
      }
    ]);
  } else {
    baseLinks.push([
      {
        label: 'Logout',
        click: handleLogout,
        icon: 'i-mdi-logout'
      }
    ]);
  }

  return baseLinks;
});

const ui = /* ui */ {
  after: 'after:inset-x-1'
};
</script>
