// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';

import ColorModeToggle from '../ColorModeToggle.vue';

function toggle() {
  return screen.getByRole('button', { name: 'Dark mode' });
}

describe('ColorModeToggle', () => {
  beforeEach(() => {
    // * The app's own plugins boot around these renders; without the session handlers their
    // * requests fail the run as unhandled.
    server.use(...authHandlers());
    useColorMode().preference = 'light';
  });

  afterEach(() => {
    cleanup();
  });

  it('starts unpressed in the light face', async () => {
    await renderSuspended(ColorModeToggle);

    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  // ! Asserts the pressed state, not `dark` on <html>: the module stamps that class through its head script, which never runs in this environment. The class itself is a live browser check.
  it('switches to the dark face, and back', async () => {
    await renderSuspended(ColorModeToggle);

    await fireEvent.click(toggle());

    await waitFor(() =>
      expect(toggle().getAttribute('aria-pressed')).toBe('true')
    );

    await fireEvent.click(toggle());

    await waitFor(() =>
      expect(toggle().getAttribute('aria-pressed')).toBe('false')
    );
  });

  // * Persistence is the module's job, but the key is the contract the head script reads before first paint — a toggle that changed only the in-memory value would reset on every reload.
  it('persists the choice where the head script reads it on the next load', async () => {
    await renderSuspended(ColorModeToggle);

    await fireEvent.click(toggle());

    await waitFor(() =>
      expect(localStorage.getItem('nuxt-color-mode')).toBe('dark')
    );
  });
});
