// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, cleanup } from '@testing-library/vue';

import { buildUser } from '@/mocks/fixtures';

import UserCard from '../UserCard.vue';

const ANA = buildUser({ name: 'Ana', email: 'ana@example.com' });

afterEach(cleanup);

// * The branch only — what the card renders once it has a user is `UserCardContent`'s own spec.
describe('UserCard', () => {
  it('renders the card once there is a user', async () => {
    await renderSuspended(UserCard, { props: { user: ANA } });

    expect(screen.getByDisplayValue('ana@example.com')).toBeTruthy();
  });

  it('stands in with a skeleton when session priming produced no user', async () => {
    await renderSuspended(UserCard, { props: { user: null } });

    expect(screen.queryByDisplayValue('ana@example.com')).toBeNull();
  });

  // ! The skeleton is decorative and `u-card` gives no per-element hook to hide it, so the grid is hidden whole and this line is the only thing a screen reader gets.
  it('announces the wait in words rather than as an empty card', async () => {
    await renderSuspended(UserCard, { props: { user: null } });

    expect(screen.getByRole('status')).toBeTruthy();
  });
});
