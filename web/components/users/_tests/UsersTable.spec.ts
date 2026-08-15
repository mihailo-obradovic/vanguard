// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, within } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import { buildUser } from '@/mocks/fixtures';

import UsersTable from '../UsersTable.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

type UsersTableProps = InstanceType<typeof UsersTable>['$props'];

const ANA = buildUser({
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  role: 'admin'
});
const BOB = buildUser({
  id: 2,
  name: 'Bob',
  email: 'bob@example.com',
  role: 'user'
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderTable(props: Partial<UsersTableProps> = {}) {
  return renderSuspended(UsersTable, {
    props: { users: [ANA, BOB], ...props },
    global: { plugins: [createVuetify()] }
  });
}

/** The row a user occupies, found by the name shown in it. */
function rowFor(name: string) {
  const row = screen
    .getAllByRole('row')
    .find((candidate) => candidate.textContent?.includes(name));

  if (!row) {
    throw new Error(`No row for ${name}`);
  }

  return within(row);
}

describe('UsersTable', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('shows each user’s identity and role', async () => {
    await renderTable();

    expect(rowFor('Ana').getByText('ana@example.com')).toBeTruthy();
    expect(rowFor('Ana').getByText('Admin')).toBeTruthy();
    expect(rowFor('Bob').getByText('bob@example.com')).toBeTruthy();
    expect(rowFor('Bob').getByText('User')).toBeTruthy();
  });

  it('offers to edit any of them, and says which', async () => {
    const { emitted } = await renderTable();

    await fireEvent.click(
      rowFor('Bob').getByRole('button', { name: 'Edit Bob' })
    );

    expect(emitted().edit).toEqual([[BOB]]);
  });

  it('offers to delete them, and says which', async () => {
    const { emitted } = await renderTable();

    await fireEvent.click(
      rowFor('Ana').getByRole('button', { name: 'Delete Ana' })
    );

    expect(emitted().delete).toEqual([[ANA]]);
  });

  // ! The API refuses a self-delete with a 403, so offering the button would be advertising a door
  // ! the user cannot open.
  it('does not offer to delete the signed-in user’s own row', async () => {
    await renderTable({ currentUserId: BOB.id });

    expect(
      rowFor('Bob').queryByRole('button', { name: 'Delete Bob' })
    ).toBeNull();
    expect(
      rowFor('Ana').getByRole('button', { name: 'Delete Ana' })
    ).toBeTruthy();
  });

  // ! The GraphQL demo's mutation has no delete, so the whole column of buttons goes.
  it('drops every delete button for a transport that has no delete', async () => {
    await renderTable({ deletable: false });

    expect(screen.queryByRole('button', { name: 'Delete Ana' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete Bob' })).toBeNull();
    expect(
      rowFor('Ana').getByRole('button', { name: 'Edit Ana' })
    ).toBeTruthy();
  });

  it('shows progress on the row being deleted, and only that row', async () => {
    await renderTable({ deletingId: ANA.id });

    expect(rowFor('Ana').getByRole('progressbar')).toBeTruthy();
    expect(rowFor('Bob').queryByRole('progressbar')).toBeNull();
  });

  it('shows no progress while nothing is being deleted', async () => {
    await renderTable();

    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

// ! The table caps its own height at the space left below it (`useElementBounding` plus the
// ! layout's published padding). That has no case here and cannot have one: happy-dom reports
// ! every element at top 0 with no layout, and the only output is a `calc()` string bound into a
// ! scoped style — an implementation detail the conventions rule out asserting. Live browser walk.
