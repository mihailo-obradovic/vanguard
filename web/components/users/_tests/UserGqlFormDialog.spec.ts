// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { h, nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';

import { UApp, USelect } from '#components';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { graphqlHandler, GRAPHQL_PATH } from '@/mocks/graphql';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import UserGqlFormDialog from '../UserGqlFormDialog.vue';

import type { User } from '@/types/auth';

const requests = recordRequests();

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | null = null;

const MUTATION = `POST ${GRAPHQL_PATH}`;

const ADA = buildUser({
  id: 7,
  name: 'Ada',
  email: 'ada@example.com',
  role: 'user'
});

/**
 * Mount the dialog the way `useOverlay` does — already open, with its subject as a prop.
 *
 * * `<u-modal>` needs `<UApp>` above it for its overlay provider, so the harness supplies one.
 */
async function mountDialog(user: User = ADA) {
  const closed: (User | undefined)[] = [];

  wrapper = await mountSuspended({
    setup: () => () =>
      h(UApp, null, {
        default: () =>
          h(UserGqlFormDialog, {
            open: true,
            user,
            onClose: (result?: User) => closed.push(result)
          })
      })
  });

  return { closed };
}

/** The variables the dialog put on the wire — the only place its partial-update decision shows. */
async function sentVariables() {
  await requests.settle();

  const index = requests.trace().indexOf(MUTATION);

  expect(index).toBeGreaterThan(-1);

  const body = (await requests.at(index)).body as {
    variables: Record<string, unknown>;
  };

  return body.variables;
}

async function settledTrace() {
  await requests.settle();

  return requests.trace();
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

/**
 * Pick a role the way the control reports one.
 *
 * ! Driven through the select's own `update:modelValue` rather than by clicking an option: Nuxt UI's
 * ! select is a Reka listbox that commits through pointer-capture APIs jsdom does not implement, so
 * ! no click, pointer sequence or keypress moves it — verified, including with the usual
 * ! `hasPointerCapture`/`scrollIntoView` stubs. The listbox committing on a click is the library's
 * ! own contract; what belongs here is that the picked role reaches the wire, which is the field
 * ! with privilege attached.
 */
function pickRole(value: string) {
  const select = wrapper!.findComponent(USelect);

  select.vm.$emit('update:modelValue', value);

  return nextTick();
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

function answersWith(user: Partial<User> = {}) {
  server.use(graphqlHandler({ data: { updateUser: { ...ADA, ...user } } }));
}

describe('UserGqlFormDialog', () => {
  beforeEach(() => {
    requests.reset();
    // * The mutation goes out through the project's own fetcher, which primes the CSRF cookie first.
    server.use(...authHandlers());
    answersWith();
  });

  afterEach(async () => {
    await flushPromises();
    // * `mountSuspended` is not one of testing-library's renders, so `cleanup()` never sees it — an unmounted wrapper here is what keeps the next test from finding two of every field.
    wrapper?.unmount();
    wrapper = null;
    cleanup();
  });

  it('opens on the user it is given, named in the title', async () => {
    await mountDialog();

    expect(screen.getByRole('dialog', { name: /Ada/ })).toBeTruthy();
    expect(field('Name').value).toBe('Ada');
    expect(field('Email').value).toBe('ada@example.com');
  });

  // ! Partial update: omitted GraphQL variables never reach the resolver, so an untouched field
  // ! keeps its value. Sending the whole form would work too, right up until two admins edit the
  // ! same user and the second overwrites the first's untouched fields.
  it('sends only the fields that actually changed', async () => {
    await mountDialog();

    await fireEvent.update(field('Name'), 'Ada Lovelace');
    await submit();

    expect(await sentVariables()).toEqual({ id: 7, name: 'Ada Lovelace' });
  });

  it('sends the id alone when nothing was touched', async () => {
    await mountDialog();

    await submit();

    expect(await sentVariables()).toEqual({ id: 7 });
  });

  it('sends a changed role', async () => {
    await mountDialog();

    await pickRole('admin');
    await submit();

    expect(await sentVariables()).toEqual({ id: 7, role: 'admin' });
  });

  it('sends nothing for a form the rules reject', async () => {
    await mountDialog();

    await fireEvent.update(field('Email'), 'not-an-email');
    await submit();

    expect(await settledTrace()).not.toContain(MUTATION);
  });

  it('names the field when the name is emptied', async () => {
    await mountDialog();

    await fireEvent.update(field('Name'), '');
    await submit();

    expect(await screen.findByText('The name field is required.')).toBeTruthy();
    expect(await settledTrace()).not.toContain(MUTATION);
  });

  // ! GraphQL reports a failed mutation as HTTP 200 with an `errors` array, so the 422 bridge only
  // ! works because `gqlFetcher` translates that shape into the REST-equivalent FetchError.
  it('renders the server verdict on the field it names', async () => {
    server.use(
      graphqlHandler({
        errors: [
          {
            message: 'Validation failed.',
            extensions: {
              category: 'validation',
              validation: { email: ['That email is already taken.'] }
            }
          }
        ]
      })
    );

    await mountDialog();

    await fireEvent.update(field('Email'), 'taken@example.com');
    await submit();

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  it('resolves with the saved user so the opener can react', async () => {
    answersWith({ name: 'Ada Lovelace' });

    const { closed } = await mountDialog();

    await fireEvent.update(field('Name'), 'Ada Lovelace');
    await submit();

    await waitFor(() => expect(closed.length).toBe(1));
    expect(closed[0]?.name).toBe('Ada Lovelace');
  });

  it('asks to close when Cancel is pressed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(closed.length).toBe(1);
    expect(closed[0]).toBeUndefined();
  });
});
