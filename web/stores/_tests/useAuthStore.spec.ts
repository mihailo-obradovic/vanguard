// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useAuthStore } from '../useAuthStore';

import type { User } from '@/types/auth';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Mihailo',
    email: 'mihailo@example.com',
    role: 'user',
    email_verified_at: null,
    created_at: '2026-08-01T00:00:00.000000Z',
    updated_at: '2026-08-01T00:00:00.000000Z',
    ...overrides
  };
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with nobody signed in', () => {
    const store = useAuthStore();

    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(store.isAdmin).toBe(false);
  });

  it('holds the user it is given', () => {
    const store = useAuthStore();
    const user = makeUser();

    store.setUser(user);

    expect(store.user).toEqual(user);
    expect(store.isLoggedIn).toBe(true);
  });

  it('recognises an admin by role', () => {
    const store = useAuthStore();

    store.setUser(makeUser({ role: 'admin' }));

    expect(store.isAdmin).toBe(true);
  });

  it('does not treat an ordinary user as an admin', () => {
    const store = useAuthStore();

    store.setUser(makeUser({ role: 'user' }));

    expect(store.isAdmin).toBe(false);
  });

  it('signs the user out on reset', () => {
    const store = useAuthStore();

    store.setUser(makeUser({ role: 'admin' }));
    store.resetUser();

    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    // * Derived, not stored — a stale isAdmin after logout would be a privilege leak.
    expect(store.isAdmin).toBe(false);
  });

  it('exposes the user read-only so actions stay the only way to change it', () => {
    const store = useAuthStore();

    store.setUser(makeUser());

    // * Pinia's store type still permits the assignment, so the guarantee is the runtime one
    // * `readonly()` gives: the write is refused rather than rejected at compile time.
    store.user = null;

    expect(store.user).not.toBeNull();
  });
});
