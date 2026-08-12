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
  background: white;
  border-top: 1px solid #e9ecef;
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
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
  color: #495057;
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
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cookie-btn--decline {
  background-color: transparent;
  color: #495057;
  border: 1px solid #e9ecef;
}

.cookie-btn--decline:hover {
  background-color: #e9ecef;
}

.cookie-btn--accept {
  background-color: rgb(0, 102, 255);
  color: white;
  border: 1px solid rgb(0, 102, 255);
}

.cookie-btn--accept:hover {
  background-color: rgba(0, 102, 255, 0.9);
}

.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
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
