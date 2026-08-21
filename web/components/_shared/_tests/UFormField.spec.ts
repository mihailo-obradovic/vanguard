// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, cleanup, waitFor } from '@testing-library/vue';

import { ERROR_EXIT_ANIMATION } from '@/config/nuxt-ui/form-field';

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

  // ! The exit class is appended to whatever the call site asked for rather than replacing it — a field styled at its call site must not lose that styling for the length of the exit.
  it("keeps a call site's own error class while the exit plays", async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE, ui: { error: 'text-lg' } }
    });

    await rerender({ error: undefined, ui: { error: 'text-lg' } });

    const held = errorElement(MESSAGE);

    // * Asserted as class tokens rather than substrings: joined without a separator the two would still read as containing both.
    expect(held?.classList.contains('text-lg')).toBe(true);
    expect(held?.classList.contains(ERROR_EXIT_ANIMATION)).toBe(true);
  });

  // ! A field can clear twice on its way out — Regle settling to `undefined` and the call site passing `false`. The second clear must not restart the exit, or the message outstays the animation that is already playing it off.
  it('does not restart the exit when the error clears a second time', async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE }
    });

    await rerender({ error: undefined });

    vi.advanceTimersByTime(100);
    await rerender({ error: false });

    // ! Advanced to a fixed point and asserted there, never through `vi.waitFor`: under fake timers that helper ticks the clock itself, so a restarted exit would still finish before it looked and the test could not tell the two apart.
    vi.advanceTimersByTime(150);
    await nextTick();

    expect(errorElement(MESSAGE)).toBeNull();
  });

  // ! An empty string is an absent error, not a message: swapping it in would blank the band instead of playing the message out, which is the blink this component exists to prevent.
  it('plays the exit for an error cleared to an empty string', async () => {
    vi.useFakeTimers();

    const { rerender } = await renderSuspended(UFormField, {
      props: { error: MESSAGE }
    });

    await rerender({ error: '' });

    const held = errorElement(MESSAGE);

    expect(held).toBeTruthy();
    expect(held?.className).toContain('slide-out-to-top-and-fade');
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
