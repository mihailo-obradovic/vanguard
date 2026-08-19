<template>
  <!-- ! Deliberately a native <select> rather than <u-select>: this is chrome that should work before hydration and get the OS picker on mobile, and Nuxt UI's listbox would trade both away for styling this matches with utilities anyway. -->
  <!-- * Transparent on the branded bar, like the buttons beside it. The option list itself is painted by the OS and ignores this, which is why the options restate their own colours. -->
  <select
    v-model="selected"
    class="ring-inverted/40 text-inverted focus-visible:outline-inverted cursor-pointer rounded-md bg-transparent px-2.5 py-1.5 text-sm ring ring-inset focus-visible:outline-2"
    :aria-label="$t('common.language')"
  >
    <option
      v-for="option in locales"
      :key="option.code"
      :value="option.code"
      class="text-default bg-default"
    >
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
