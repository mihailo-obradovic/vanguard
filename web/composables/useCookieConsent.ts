type CookieConsentValue = 'accepted' | 'declined';

export function useCookieConsent() {
  const consent = useCookie<CookieConsentValue | null>('cookie_consent', {
    maxAge: 60 * 60 * 24 * 365,
    default: () => null
  });

  const isDecided = computed(() => consent.value !== null);
  const hasConsented = computed(() => consent.value === 'accepted');

  function accept() {
    consent.value = 'accepted';
  }

  function decline() {
    consent.value = 'declined';
  }

  return { consent, isDecided, hasConsented, accept, decline };
}
