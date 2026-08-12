import { Temporal } from 'temporal-polyfill';

// * Formats an ISO timestamp from the API as a human-readable date in the active locale, e.g. "August 3, 2026" or "3. avgust 2026.". UTC keeps the date stable regardless of client timezone.
export function formatDate(dateString: string): string {
  // * Resolved per call, never at module scope — the Nuxt app does not exist at import time.
  const { locale, t } = useNuxtApp().$i18n;

  if (!dateString) {
    return t('common.notAvailable');
  }

  return Temporal.Instant.from(dateString).toLocaleString(locale.value, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
