// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';

import { useExternalErrors } from '../useExternalErrors';

describe('useExternalErrors', () => {
  it('starts empty, before anything has come back from the server', () => {
    expect(useExternalErrors(ref({})).value).toEqual({});
  });

  it('takes on the errors the server sends', async () => {
    const source = ref<Record<string, string[]>>({});
    const externalErrors = useExternalErrors(source);

    source.value = { email: ['That email is taken.'] };
    await nextTick();

    expect(externalErrors.value).toEqual({
      email: ['That email is taken.']
    });
  });

  // ! The copy is the whole point, and it was missing until this spec caught it. Regle deletes
  // ! entries from `externalErrors` as the user edits the offending field; with the source shared
  // ! by reference that delete reached back into the caller's own object — in practice the cached
  // ! value of the `useValidationErrors` computed feeding it, which anything else reading those
  // ! errors then saw as empty.
  it('copies rather than shares, so Regle can clear entries without touching the source', async () => {
    const source = ref<Record<string, string[]>>({});
    const externalErrors = useExternalErrors(source);

    const serverErrors = { email: ['That email is taken.'] };

    source.value = serverErrors;
    await nextTick();

    delete externalErrors.value.email;

    expect(serverErrors).toEqual({ email: ['That email is taken.'] });
  });

  it('replaces the previous errors when the next submit fails differently', async () => {
    const source = ref<Record<string, string[]>>({ email: ['Taken.'] });
    const externalErrors = useExternalErrors(source);

    source.value = { name: ['Required.'] };
    await nextTick();

    expect(externalErrors.value).toEqual({ name: ['Required.'] });
  });

  it('accepts a getter as its source, the way a form passes a computed', async () => {
    const errors = ref<Record<string, string[]>>({});
    const externalErrors = useExternalErrors(() => errors.value);

    errors.value = { password: ['Too short.'] };
    await nextTick();

    expect(externalErrors.value).toEqual({ password: ['Too short.'] });
  });
});
