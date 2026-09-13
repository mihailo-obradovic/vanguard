// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockNuxtImport, renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';

import ErrorPage from '../error.vue';

const { clearError, reloadNuxtApp } = vi.hoisted(() => ({
  clearError: vi.fn<(options?: { redirect?: string }) => void>(),
  reloadNuxtApp: vi.fn<() => void>()
}));

mockNuxtImport('clearError', () => clearError);
mockNuxtImport('reloadNuxtApp', () => reloadNuxtApp);

// * Built through Nuxt's own `createError`, so the page receives the object shape Nuxt hands it, not a hand-rolled lookalike.
function renderError(input: Parameters<typeof createError>[0]) {
  return renderSuspended(ErrorPage, { props: { error: createError(input) } });
}

describe('the error page', () => {
  beforeEach(async () => {
    // * The app's own plugins boot around these renders; without the session handlers their requests fail the run as unhandled.
    server.use(...authHandlers());
    clearError.mockReset();
    reloadNuxtApp.mockReset();
    await useNuxtApp().$i18n.setLocale('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('tells a visitor the page does not exist', async () => {
    await renderError({
      statusCode: 404,
      statusMessage: 'Page not found: /no-such-page',
      message: 'Page not found: /no-such-page'
    });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      '404 — Page Not Found'
    );
    expect(
      screen.getByText(
        'The page you are looking for does not exist or has been moved.'
      )
    ).not.toBeNull();
  });

  // ! The message is chosen by status and never taken from the error: Nuxt's own text is written for developers, and a thrown TypeError's would read as gibberish to the person looking at the page.
  it('keeps a developer message out of the visible copy', async () => {
    await renderError({
      statusCode: 503,
      message: 'Cannot read properties of undefined'
    });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      '503 — Something Went Wrong'
    );
    expect(
      screen.getByText('An unexpected error occurred. Please try again.')
    ).not.toBeNull();
    expect(
      screen.queryByText('Cannot read properties of undefined', {
        selector: ':not(pre)'
      })
    ).toBeNull();
  });

  // ! Exactly three fields: `cause` and `data` can carry request payloads and stacks.
  it('puts exactly the status and messages in the technical details', async () => {
    await renderError({
      statusCode: 500,
      statusMessage: 'Server Error',
      message: 'Internal Server Error',
      data: { secret: 'payload' },
      cause: new Error('stack')
    });

    await fireEvent.click(
      screen.getByRole('button', { name: 'Technical details' })
    );

    const details = await screen.findByText(/"statusCode"/);

    expect(JSON.parse(details.textContent ?? '')).toEqual({
      statusCode: 500,
      statusMessage: 'Server Error',
      message: 'Internal Server Error'
    });
  });

  it('goes home by clearing the error', async () => {
    await renderError({ statusCode: 404 });

    await fireEvent.click(screen.getByRole('button', { name: 'Go Home' }));

    expect(clearError).toHaveBeenCalledWith({ redirect: '/home' });
  });

  it('refreshes by reloading the app', async () => {
    await renderError({ statusCode: 500 });

    await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(reloadNuxtApp).toHaveBeenCalledOnce();
  });
});
