<template>
  <!-- * The link list itself, rendered twice by the layout — inline on the left at `lg`, inside a slideover below it — so the two can never drift apart. -->
  <nav class="flex flex-col gap-1">
    <u-button
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :icon="link.icon"
      :label="link.label"
      color="neutral"
      variant="ghost"
      block
      class="justify-start"
      active-variant="soft"
      @click="emit('navigate')"
    />
  </nav>
</template>

<script setup lang="ts">
const emit = defineEmits<{ navigate: [] }>();

const { t } = useI18n();

const { isLoggedIn, isAdmin } = storeToRefs(useAuthStore());

// * Mirrors the drawer on the vuetify variant: the signed-in destinations, admin ones only for an admin. Home stays in the header, where it is reachable without opening anything.
const links = computed(() => [
  ...(isLoggedIn.value
    ? [
        {
          to: '/profile',
          icon: 'i-lucide-user',
          label: t('common.nav.profile')
        }
      ]
    : []),
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
