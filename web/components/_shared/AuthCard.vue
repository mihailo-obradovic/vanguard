<template>
  <div class="auth-card-container">
    <div class="auth-card">
      <h1 class="auth-card-title">{{ title }}</h1>

      <p v-if="hint" class="auth-card-hint">{{ hint }}</p>

      <form class="auth-card-form" novalidate @submit.prevent="emit('submit')">
        <slot />

        <button
          type="submit"
          class="auth-card-submit"
          :disabled="submitting || disabled"
        >
          {{ submitting ? submittingLabel : submitLabel }}
        </button>
      </form>

      <div v-if="$slots.footer" class="auth-card-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

<style scoped>
.auth-card-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.auth-card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border);
}

.auth-card-title {
  text-align: center;
  margin: 0 0 24px 0;
  color: var(--color-brand);
  font-size: 28px;
  font-weight: 600;
}

/* * A hint pulls the title's bottom margin in, so the two read as one block. */
.auth-card-title:has(+ .auth-card-hint) {
  margin-bottom: 16px;
}

.auth-card-hint {
  text-align: center;
  margin: 0 0 24px 0;
  color: var(--color-text);
  font-size: 14px;
}

.auth-card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-card-submit {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
  margin-top: 8px;
}

.auth-card-submit:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}

.auth-card-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-card-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

/* * Deep, because the footer's links are slot content and carry the caller's scope id. */
.auth-card-footer :deep(p) {
  margin: 0;
  color: var(--color-text);
}

.auth-card-footer :deep(a) {
  color: var(--color-brand);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition);
}

.auth-card-footer :deep(a:hover) {
  color: var(--color-brand-hover-text);
  text-decoration: underline;
}
</style>
