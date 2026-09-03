// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { defineComponent } from 'vue';

import { useAppMutation } from '../useAppMutation';

import type { AppMutationOptions } from '../useAppMutation';

const { setupQueryErrorHandling } = vi.hoisted(() => ({
  setupQueryErrorHandling: vi.fn<(...args: unknown[]) => void>()
}));

mockNuxtImport('setupQueryErrorHandling', () => setupQueryErrorHandling);

function mountMutation<TData, TVars>(
  options: AppMutationOptions<TData, TVars>
) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const mutation = useAppMutation<TData, TVars>(options);

        return { mutation };
      },
      template: '<div />'
    }),
    { global: { plugins: [createPinia(), PiniaColada] } }
  );

  return wrapper.vm.mutation;
}

describe('useAppMutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setupQueryErrorHandling.mockClear();
  });

  it('runs the mutation with its variables and exposes the result', async () => {
    const mutation = mountMutation({
      mutation: (name: string) => Promise.resolve(`saved ${name}`)
    });

    await expect(mutation.mutateAsync('Mihailo')).resolves.toBe(
      'saved Mihailo'
    );
    expect(mutation.data.value).toBe('saved Mihailo');
  });

  it('runs the caller callbacks', async () => {
    const onSuccess = vi.fn<() => void>();
    const onSettled = vi.fn<() => void>();

    const mutation = mountMutation({
      mutation: () => Promise.resolve('done'),
      onSuccess,
      onSettled
    });

    await mutation.mutateAsync();

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it('surfaces a failure on the mutation error instead of throwing at the call site', async () => {
    const failure = new Error('Request failed');

    const mutation = mountMutation({
      mutation: () => Promise.reject(failure)
    });

    mutation.mutate();
    await flushPromises();

    expect(mutation.error.value).toBe(failure);
  });

  it('wires central error handling when called from a component', () => {
    mountMutation({ mutation: () => Promise.resolve('done') });

    expect(setupQueryErrorHandling).toHaveBeenCalledOnce();
  });

  it('passes the caller error-handling options to the handler', () => {
    mountMutation({
      mutation: () => Promise.resolve('done'),
      errorHandling: { suppressToasts: 'validation' }
    });

    expect(setupQueryErrorHandling.mock.calls[0]?.[1]).toEqual({
      suppressToasts: 'validation'
    });
  });

  it('skips error handling outside a component instance', async () => {
    const pinia = createPinia();

    setActivePinia(pinia);

    // * Documented edge case: the watcher would have no scope to be disposed with, so such
    // * callers own their errors (features/005_client-data-layer.md).
    const wrapper = mount(defineComponent({ template: '<div />' }), {
      global: { plugins: [pinia, PiniaColada] }
    });

    useAppMutation({ mutation: () => Promise.resolve('done') });

    await flushPromises();
    wrapper.unmount();

    expect(setupQueryErrorHandling).not.toHaveBeenCalled();
  });
});
