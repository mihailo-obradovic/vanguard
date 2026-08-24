<template>
  <!-- * Only reachable when session priming failed to produce a user. A skeleton in the card's own footprint, not a bare line of text, so the page keeps its shape. -->
  <div v-if="!user" class="flex flex-col">
    <p class="sr-only" role="status">{{ $t('profile.loading') }}</p>

    <u-card
      aria-hidden="true"
      :ui="{ root: 'flex flex-col', header: 'shrink-0' }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <u-skeleton class="h-7 w-40" />

          <u-skeleton class="size-8" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- * `pb-6` is the band every form field reserves for its error line (`config/nuxt-ui/form-field.ts`); without it the skeleton stands two error bands shorter than the form it replaces. -->
        <div v-for="field in 2" :key="field" class="pb-6">
          <u-skeleton class="h-5 w-24" />

          <u-skeleton class="mt-1 h-8 w-full" />
        </div>
      </div>

      <dl class="mt-6 grid gap-4 sm:grid-cols-2">
        <div v-for="item in 4" :key="item">
          <u-skeleton class="h-5 w-28" />

          <u-skeleton class="mt-1 h-7 w-32" />
        </div>
      </dl>
    </u-card>
  </div>

  <UserCardContent v-else :user="user" />
</template>

<script setup lang="ts">
import UserCardContent from './UserCardContent.vue';

import type { User } from '@/types/auth';

// * The card is split so the skeleton can sit beside the markup it mirrors without the content's setup — a form, its rules and three mutations — having to tolerate a user that is not there yet.
defineProps<{ user: User | null }>();
</script>
