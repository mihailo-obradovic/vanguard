<template>
  <div v-if="!user" class="loading-state">
    <p>{{ $t('profile.loading') }}</p>
  </div>

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

<style scoped>
.loading-state {
  text-align: center;
  padding: 64px 32px;
  color: var(--color-text-muted);
}

.loading-state p {
  margin: 0;
  font-size: 18px;
}
</style>
