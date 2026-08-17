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
  it('names the role it is given', async () => {
    await renderSuspended(RoleBadge, { props: { role: 'admin' } });

    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('names the other role too', async () => {
    await renderSuspended(RoleBadge, { props: { role: 'user' } });

    expect(screen.getByText('User')).toBeTruthy();
  });
});
