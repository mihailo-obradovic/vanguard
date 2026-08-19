// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { defineComponent, ref } from 'vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';

import { accountEmailRules, credentialEmailRules } from '../emailRules';

import type { Ref } from 'vue';

const requests = recordRequests();

// * Driven through a real Regle instance rather than by calling the rule objects: what the forms depend on is whether a given address can submit, and the async rule only debounces inside one.
async function setupForm(rules: () => Record<string, unknown>, initial = '') {
  const form: Ref<{ email: string }> = ref({ email: initial });

  let validate!: () => Promise<boolean>;
  let errors!: () => string[];

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, rules);

        validate = async () => (await r$.$validate()).valid;
        errors = () => r$.email.$errors;

        return () => null;
      }
    })
  );

  return { form, validate, errors };
}

function respondWith(available: boolean) {
  server.use(
    http.get(apiUrl('/api/email-availability'), () =>
      HttpResponse.json({ available })
    )
  );
}

describe('emailRules', () => {
  beforeEach(() => {
    requests.reset();
  });

  describe('accountEmailRules', () => {
    it('accepts a free, well-formed, lowercase address', async () => {
      respondWith(true);

      const { validate } = await setupForm(
        () => accountEmailRules(),
        'free@example.com'
      );

      expect(await validate()).toBe(true);
    });

    it('rejects an address the server reports as taken', async () => {
      respondWith(false);

      const { validate } = await setupForm(
        () => accountEmailRules(),
        'taken@example.com'
      );

      expect(await validate()).toBe(false);
    });

    it('names the field when the address is taken', async () => {
      respondWith(false);

      const { validate, errors } = await setupForm(
        () => accountEmailRules(),
        'taken@example.com'
      );

      await validate();

      expect(errors()).toContain('The email field is already taken.');
    });

    // ! The whole point of the fail-open contract: the backend's `unique` rule is the authority, so a check that cannot complete must not stop a user who would otherwise succeed.
    it('stays valid when the check fails', async () => {
      server.use(
        http.get(
          apiUrl('/api/email-availability'),
          () => new HttpResponse(null, { status: 500 })
        )
      );

      const { validate } = await setupForm(
        () => accountEmailRules(),
        'free@example.com'
      );

      expect(await validate()).toBe(true);
    });

    it('stays valid when the check is rate limited', async () => {
      server.use(
        http.get(
          apiUrl('/api/email-availability'),
          () => new HttpResponse(null, { status: 429 })
        )
      );

      const { validate } = await setupForm(
        () => accountEmailRules(),
        'free@example.com'
      );

      expect(await validate()).toBe(true);
    });

    it('mirrors the backend lowercase rule', async () => {
      respondWith(true);

      const { validate, errors } = await setupForm(
        () => accountEmailRules(),
        'Mixed@Example.com'
      );

      expect(await validate()).toBe(false);
      expect(errors()).toContain('The email field must be lowercase.');
    });

    it('rejects an address over 255 characters', async () => {
      respondWith(true);

      const { validate } = await setupForm(
        () => accountEmailRules(),
        `${'a'.repeat(60)}@${'b.'.repeat(100)}com`
      );

      expect(await validate()).toBe(false);
    });

    // * No request for a value the server would only 422 on — `required` and `email` already report those, and asking anyway would spend a round-trip per keystroke on nothing.
    it('does not ask the server about an empty value', async () => {
      respondWith(true);

      const { validate } = await setupForm(() => accountEmailRules(), '');

      expect(await validate()).toBe(false);

      await requests.settle();

      expect(requests.count()).toBe(0);
    });

    it('does not ask the server about a malformed address', async () => {
      respondWith(true);

      const { validate } = await setupForm(
        () => accountEmailRules(),
        'not-an-email'
      );

      expect(await validate()).toBe(false);

      await requests.settle();

      expect(requests.count()).toBe(0);
    });

    it('forwards the ignored user so an unchanged address stays valid', async () => {
      let requestUrl = '';

      server.use(
        http.get(apiUrl('/api/email-availability'), ({ request }) => {
          requestUrl = request.url;

          return HttpResponse.json({ available: true });
        })
      );

      const { validate } = await setupForm(
        () => accountEmailRules(() => 7),
        'mine@example.com'
      );

      expect(await validate()).toBe(true);
      expect(new URL(requestUrl).searchParams.get('ignore_id')).toBe('7');
    });
  });

  describe('credentialEmailRules', () => {
    // * Login and the reset pair read an existing account, so they mirror endpoints that carry neither rule. Asking whether a sign-in address is "available" would invert the meaning.
    it('accepts a mixed-case address without asking the server', async () => {
      const { validate } = await setupForm(
        () => credentialEmailRules(),
        'Mixed@Example.com'
      );

      expect(await validate()).toBe(true);

      await requests.settle();

      expect(requests.count()).toBe(0);
    });

    it('still requires a well-formed address within the length bound', async () => {
      const { validate, form } = await setupForm(
        () => credentialEmailRules(),
        ''
      );

      expect(await validate()).toBe(false);

      form.value.email = 'not-an-email';
      expect(await validate()).toBe(false);

      form.value.email = `${'a'.repeat(60)}@${'b.'.repeat(100)}com`;
      expect(await validate()).toBe(false);

      form.value.email = 'user@example.com';
      expect(await validate()).toBe(true);
    });
  });
});
