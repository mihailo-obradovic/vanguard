// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';

import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import SidebarNav from '../SidebarNav.vue';

// * The whole contract is the link set, so each case reads it as (label, destination, icon) triples
// * rather than by name alone: the destination is what the user actually gets, and a link pointing
// * somewhere else while reading correctly is the failure a name-only assertion cannot see.
function entries() {
  return [...(document.querySelector('nav')?.children ?? [])];
}

function links() {
  return entries().map((link) => ({
    label: link.textContent?.trim(),
    to: link.getAttribute('href'),
    // * Nuxt Icon rewrites `i-lucide-user` into the `i-lucide:user` class it renders, so the
    // * assertion reads the rendered form rather than the string the component passes.
    icon: [
      ...(link.querySelector('[data-slot="leadingIcon"]')?.classList ?? [])
    ].find((name) => name.startsWith('i-lucide:'))
  }));
}

const PROFILE = { label: 'Profile', to: '/profile', icon: 'i-lucide:user' };
const USERS = { label: 'Users', to: '/users', icon: 'i-lucide:users' };
const GRAPHQL = {
  label: 'GraphQL Demo',
  to: '/graphql-demo',
  icon: 'i-lucide:braces'
};

describe('SidebarNav', () => {
  beforeEach(() => {
    useAuthStore().resetUser();
  });

  afterEach(() => {
    cleanup();
  });

  // ! The admin entries are the security-adjacent part. They are a convenience and not the control —
  // ! every one of those pages is authorized again by the API — but offering them to someone who
  // ! cannot open them advertises a door, so each role's exact set is pinned rather than sampled.
  // ! Asserted as "the nav is empty", not "there are no links": an entry that is not a link — a
  // ! malformed one with no destination — renders as a plain button and slips past a link-only
  // ! count, which is exactly what the empty arms of the two spreads would produce if they stopped
  // ! being empty.
  it('offers a signed-out visitor nothing', async () => {
    await renderSuspended(SidebarNav);

    expect(entries()).toHaveLength(0);
  });

  it('offers a signed-in user their profile and nothing more', async () => {
    useAuthStore().setUser(buildUser({ role: 'user' }));

    await renderSuspended(SidebarNav);

    expect(links()).toEqual([PROFILE]);
  });

  it('adds the admin destinations for an admin, in order', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    await renderSuspended(SidebarNav);

    expect(links()).toEqual([PROFILE, USERS, GRAPHQL]);
  });

  // * The layout renders this list twice — inline beside the page and inside the slideover — and the
  // * slideover has to close when a link inside it is taken. The component cannot close it, so it
  // * says a link was followed and lets the layout decide.
  it('announces that a link was followed', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    const { emitted } = await renderSuspended(SidebarNav);

    await fireEvent.click(screen.getByRole('link', { name: 'Users' }));

    expect(emitted('navigate')).toHaveLength(1);
  });
});
