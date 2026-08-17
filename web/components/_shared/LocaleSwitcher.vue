<template>
  <select
    v-model="selected"
    class="locale-select"
    :aria-label="$t('common.language')"
  >
    <option v-for="option in locales" :key="option.code" :value="option.code">
      {{ option.name }}
    </option>
  </select>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n();

// * Writing through setLocale rather than to `locale` directly is what persists the choice to the detection cookie.
const selected = computed({
  get: () => locale.value,
  set: (code) => setLocale(code)
});
</script>

<style scoped>
.locale-select {
  font-family: 'Lexend', sans-serif;
  background-color: transparent;
  color: var(--color-on-brand);
  border: 1px solid white;
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 16px;
  line-height: normal;
  cursor: pointer;
  transition: all var(--transition);
}

.locale-select:hover {
  background-color: var(--color-surface);
  color: var(--color-brand);
}

/* * The dropdown list is painted by the OS, which ignores the transparent background above. */
.locale-select option {
  color: var(--color-text-strong);
  background-color: var(--color-surface);
}
</style>
