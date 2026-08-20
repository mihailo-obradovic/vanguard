<template>
  <div class="mx-auto flex h-full w-full max-w-3xl flex-col">
    <!-- * `min-h-0` without `flex-1`: the card keeps hugging its content, but may now shrink to the column instead of growing past it, which is what hands the overflow to its own body. -->
    <UserCard v-if="user" :user="user" class="min-h-0" />

    <p v-else class="py-16 text-center text-muted">
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
