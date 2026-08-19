<template>
  <div class="mx-auto w-full max-w-3xl">
    <UserCard v-if="user" :user="user" />

    <p v-else class="text-muted py-16 text-center">
      {{ $t('profile.loading') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import UserCard from '@/components/profile/UserCard.vue';

import { useRefreshUser } from '@/services/queries/useAuthQueries';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const { user } = storeToRefs(useAuthStore());

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
