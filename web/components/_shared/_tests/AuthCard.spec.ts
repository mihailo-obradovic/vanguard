// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { h } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';

import AuthCard from '../AuthCard.vue';

const BASE = {
  title: 'Welcome Back',
  submitLabel: 'Log in',
  submittingLabel: 'Logging in…'
};

function submitButton() {
  return screen.getByRole('button') as HTMLButtonElement;
}

async function render(
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {}
) {
  const submits: true[] = [];

  await renderSuspended(AuthCard, {
    props: { ...BASE, ...props, onSubmit: () => submits.push(true) },
    slots: { default: () => h('input', { type: 'email' }), ...slots }
  });

  return { submits };
}

describe('AuthCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('heads the screen with its title', async () => {
    await render();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome Back' })
    ).toBeTruthy();
  });

  it('shows a hint when one is given', async () => {
    await render({ hint: 'Enter the address you signed up with.' });

    expect(
      screen.getByText('Enter the address you signed up with.')
    ).toBeTruthy();
  });

  // * Only the forgot-password screen has a hint; the others must not reserve space for one.
  it('shows no hint when none is given', async () => {
    await render();

    expect(document.querySelectorAll('p')).toHaveLength(0);
  });

  it('renders the fields it is given', async () => {
    await render();

    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  // ! The button is the form's submit control, so pressing it has to reach the page's handler
  // ! through the card rather than doing a native page-navigating submit.
  it('asks the page to submit when the button is pressed', async () => {
    const { submits } = await render();

    await fireEvent.click(submitButton());

    expect(submits).toHaveLength(1);
  });

  it('names the action, and renames it while the request is in flight', async () => {
    await render();

    expect(submitButton().textContent?.trim()).toBe('Log in');

    cleanup();
    await render({ submitting: true });

    expect(submitButton().textContent?.trim()).toBe('Logging in…');
  });

  it('refuses a second press while the request is in flight', async () => {
    await render({ submitting: true });

    expect(submitButton().disabled).toBe(true);
  });

  it('refuses a submit the form has already judged invalid', async () => {
    await render({ disabled: true });

    expect(submitButton().disabled).toBe(true);
  });

  it('carries the footer links it is given', async () => {
    await render(
      {},
      { footer: () => h('a', { href: '/register' }, 'Register here') }
    );

    expect(screen.getByRole('link', { name: 'Register here' })).toBeTruthy();
  });
});
