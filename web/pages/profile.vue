<template>
  <p v-if="!user" class="text-muted-foreground px-8 py-16 text-center text-lg">
    {{ $t('profile.loading') }}
  </p>

  <UserCard v-else />
</template>

<script setup lang="ts">
import UserCard from '@/components/users/UserCard.vue';

import { useRefreshUser } from '@/services/queries/useAuthQueries';

const { t } = useI18n();

const { user } = storeToRefs(useAuthStore());

const route = useRoute();
const router = useRouter();

const { mutate: refreshUser } = useRefreshUser({
  onSuccess: () => {
    $toast(t('profile.toasts.emailVerified'), 'success');
    router.replace({ query: {} });
  }
});

onMounted(() => {
  if (route.query.verified === '1') {
    refreshUser();
  }
});
</script>
