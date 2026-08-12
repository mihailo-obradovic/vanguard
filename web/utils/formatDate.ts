import { Temporal } from 'temporal-polyfill';

// * Formats an ISO timestamp from the API as a human-readable date, e.g. "August 3, 2026". UTC keeps the date stable regardless of client timezone.
export function formatDate(dateString: string): string {
  if (!dateString) {
    return 'N/A';
  }

  return Temporal.Instant.from(dateString).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
