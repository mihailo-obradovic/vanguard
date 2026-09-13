<template>
  <NuxtLoadingIndicator
    color="var(--primary)"
    error-color="var(--destructive)"
  />

  <!-- * The empty layout, not the default one: an error thrown by the navbar, its dialogs or the session bootstrap would be thrown again by rendering that shell around its own error page. -->
  <NuxtLayout name="empty">
    <Card class="w-full max-w-[480px]">
      <CardHeader>
        <!-- * `h1`: the card IS the page, so its title is the page's only heading. -->
        <CardTitle
          as="h1"
          class="text-primary text-center text-2xl font-semibold text-balance"
        >
          {{ error.statusCode }} — {{ title }}
        </CardTitle>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
        <p class="text-muted-foreground text-center">
          {{ message }}
        </p>

        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="refresh">
            <RotateCw />
            {{ $t('errors.page.refresh') }}
          </Button>

          <Button class="flex-1" @click="goHome">
            <House />
            {{ $t('errors.page.goHome') }}
          </Button>
        </div>

        <Collapsible>
          <CollapsibleTrigger as-child>
            <Button variant="ghost" class="group w-full justify-between">
              {{ $t('errors.page.technicalDetails') }}

              <ChevronDown
                class="transition-transform group-data-[state=open]:rotate-180"
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <UIScrollArea class="bg-muted mt-2 max-h-48 rounded-md">
              <pre class="p-3 text-xs break-words whitespace-pre-wrap">{{
                details
              }}</pre>
            </UIScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ChevronDown, House, RotateCw } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const { t } = useI18n();

const isNotFound = computed(() => props.error.statusCode === 404);

const title = computed(() =>
  isNotFound.value
    ? t('errors.page.notFoundTitle')
    : t('errors.page.unexpectedTitle')
);

// * Always localized copy, never the error's own text: Nuxt's messages are written for developers ("Page not found: /no-such-page", or a thrown TypeError's), so they belong in the details below.
const message = computed(() =>
  isNotFound.value
    ? t('errors.page.notFoundMessage')
    : t('errors.page.unexpectedMessage')
);

// ! Exactly these three fields. `cause` and `data` can carry request payloads and stack traces, which have no place on a page end users see.
const details = computed(() =>
  JSON.stringify(
    {
      statusCode: props.error.statusCode,
      statusMessage: props.error.statusMessage,
      message: props.error.message
    },
    null,
    2
  )
);

function goHome() {
  clearError({ redirect: '/home' });
}

function refresh() {
  reloadNuxtApp();
}
</script>
