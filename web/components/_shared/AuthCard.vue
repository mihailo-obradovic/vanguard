<template>
  <div class="flex flex-1 items-center justify-center p-4">
    <Card class="w-full max-w-[400px]">
      <CardHeader>
        <!-- * `h1`: on an auth screen this card IS the page, so its title is the page's only heading. -->
        <CardTitle
          as="h1"
          class="text-primary text-center text-2xl font-semibold"
        >
          {{ title }}
        </CardTitle>

        <CardDescription v-if="hint" class="text-center">
          {{ hint }}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form novalidate @submit.prevent="emit('submit')">
          <!-- * Default: `gap-7`. Each field already reserves two lines under its control for errors, so upstream's gap double-counts the separation and the form reads loose. -->
          <FieldGroup class="gap-4">
            <slot />

            <Button type="submit" :disabled="submitting || disabled">
              {{ submitting ? submittingLabel : submitLabel }}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>

      <!-- * The footer's links are slot content, so their styling travels with the slot rather than living here — `[&_a]:` reaches them without a scoped `:deep()`. -->
      <CardFooter
        v-if="$slots.footer"
        class="text-muted-foreground flex-col border-t text-center text-sm [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline"
      >
        <slot name="footer" />
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';

defineProps<{
  title: string;
  // * Guidance above the fields — only the forgot-password screen has any.
  hint?: string;
  submitLabel: string;
  submittingLabel: string;
  submitting?: boolean;
  // * The form's own verdict (`r$.$invalid`); the card adds `submitting` to it.
  disabled?: boolean;
}>();

const emit = defineEmits<{ submit: [] }>();
</script>
