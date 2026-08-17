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
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e9ecef;
}

.auth-card-title {
  text-align: center;
  margin: 0 0 24px 0;
  color: rgb(0, 102, 255);
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
  color: #495057;
  font-size: 14px;
}

.auth-card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-card-submit {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
  margin-top: 8px;
}

.auth-card-submit:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.auth-card-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-card-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

/* * Deep, because the footer's links are slot content and carry the caller's scope id. */
.auth-card-footer :deep(p) {
  margin: 0;
  color: #495057;
}

.auth-card-footer :deep(a) {
  color: rgb(0, 102, 255);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.25s ease;
}

.auth-card-footer :deep(a:hover) {
  color: rgba(0, 102, 255, 0.8);
  text-decoration: underline;
}
</style>
