<template>
  <Transition name="cookie-slide">
    <div
      v-if="isMounted && !isDecided"
      class="cookie-banner"
      role="region"
      :aria-label="$t('common.cookieConsent.label')"
    >
      <div class="cookie-content">
        <p class="cookie-message">
          {{ $t('common.cookieConsent.message') }}
        </p>

        <div class="cookie-actions">
          <button
            type="button"
            class="cookie-btn cookie-btn--decline"
            @click="decline"
          >
            {{ $t('common.cookieConsent.decline') }}
          </button>

          <button
            type="button"
            class="cookie-btn cookie-btn--accept"
            @click="accept"
          >
            {{ $t('common.cookieConsent.accept') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isDecided, accept, decline } = useCookieConsent();

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: var(--shadow-card-up);
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cookie-message {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
}

.cookie-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cookie-btn {
  font-family: 'Lexend', sans-serif;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.cookie-btn--decline {
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.cookie-btn--decline:hover {
  background-color: var(--color-border);
}

.cookie-btn--accept {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: 1px solid var(--color-brand);
}

.cookie-btn--accept:hover {
  background-color: var(--color-brand-hover);
}

.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition:
    transform var(--transition),
    opacity var(--transition);
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .cookie-content {
    flex-direction: column;
    align-items: stretch;
  }

  .cookie-actions {
    justify-content: flex-end;
  }
}
</style>
