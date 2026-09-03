// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, cleanup } from '@testing-library/vue';

import RoleBadge from '../RoleBadge.vue';

describe('RoleBadge', () => {
  afterEach(() => {
    cleanup();
  });

  // * The badge resolves the role's own copy, which is why every call site could stop repeating the
  // * `users.roles.*` key.
  //
  // * Both role strings are always in the DOM — the inactive one is the ghost reserving the badge's
  // * width — so these assert the one that is not `aria-hidden`: the role a user is actually told.
  const shown = { ignore: '[aria-hidden="true"]' };

  it('names the role it is given', async () => {
    await renderSuspended(RoleBadge, { props: { role: 'admin' } });

    expect(screen.getByText('Admin', shown)).toBeTruthy();
    expect(screen.queryByText('User', shown)).toBeNull();
  });

  it('names the other role too', async () => {
    await renderSuspended(RoleBadge, { props: { role: 'user' } });

    expect(screen.getByText('User', shown)).toBeTruthy();
    expect(screen.queryByText('Admin', shown)).toBeNull();
  });
});
