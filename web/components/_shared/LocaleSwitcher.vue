<template>
  <Select v-model="selected">
    <!-- * `on-primary` because the navbar is a primary fill; the chevron's own 50% opacity is raised to 70%, which puts it at 3.74:1 against that fill — the floor an affordance answers to, and still quieter than the label. -->
    <SelectTrigger
      :aria-label="$t('common.language')"
      variant="on-primary"
      class="w-auto [&_svg]:opacity-70"
    >
      <!-- * The name is passed explicitly rather than left to `SelectValue`'s own lookup, which resolves through the items and so reads empty until the list has been opened once. -->
      <SelectValue>{{ activeLocaleName }}</SelectValue>
    </SelectTrigger>

    <SelectContent>
      <SelectItem
        v-for="option in locales"
        :key="option.code"
        :value="option.code"
      >
        {{ option.name }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const { locale, locales, setLocale } = useI18n();

// * Writing through setLocale rather than to `locale` directly is what persists the choice to the detection cookie.
const selected = computed({
  get: () => locale.value,
  set: (code) => setLocale(code)
});

const activeLocaleName = computed(
  () =>
    locales.value.find((option) => option.code === locale.value)?.name ??
    locale.value
);
</script>
