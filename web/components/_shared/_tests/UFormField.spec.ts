// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, cleanup, waitFor } from '@testing-library/vue';

import UFormField from '../UFormField.vue';

const MESSAGE = 'The name field is required.';
const OTHER_MESSAGE = 'The name field is too long.';

// * The band the field reserves is what makes an exit animation worth having: the message plays out in place instead of blinking away, and nothing below it moves either way.
function errorElement(message: string) {
  return screen.queryByText(message);
}

describe('UFormField', () => {
  afterEach(() => {
    cleanup();

    vi.useRealTimers();
  });

  it('renders the error it is given', async () => {
    await renderSuspended(UFormField, { props: { error: MESSAGE } });

    expect(errorElement(MESSAGE)).toBeTruthy();
  });

  // ! The reason this component exists. Nuxt UI unmounts the message the instant the error clears, so without the hold there is nothing left in the DOM for an exit animation to run on.
  it('holds a cleared error on screen so its exit animation can play', async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE }
    });

    await rerender({ error: undefined });

    const held = errorElement(MESSAGE);

    expect(held).toBeTruthy();
    expect(held?.className).toContain('slide-out-to-top-and-fade');
    // * The enter half is gone rather than fighting it — tailwind-merge keeps only the last animation.
    expect(held?.className).not.toContain('slide-in-from-top-and-fade');
  });

  it('drops the message once the exit has played', async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE }
    });

    await rerender({ error: undefined });

    vi.advanceTimersByTime(200);
    await vi.waitFor(() => expect(errorElement(MESSAGE)).toBeNull());
  });

  // * A field that fails a second rule mid-exit shows the new message straight away; a stale one fading out over a live error would misreport the field.
  it('replaces a message that is still leaving', async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE }
    });

    await rerender({ error: undefined });
    await rerender({ error: OTHER_MESSAGE });

    const shown = errorElement(OTHER_MESSAGE);

    expect(shown).toBeTruthy();
    expect(shown?.className).not.toContain('slide-out-to-top-and-fade');

    // * The cancelled exit must not fire later and take the live message with it.
    vi.advanceTimersByTime(400);
    await waitFor(() => expect(errorElement(OTHER_MESSAGE)).toBeTruthy());
  });
});
