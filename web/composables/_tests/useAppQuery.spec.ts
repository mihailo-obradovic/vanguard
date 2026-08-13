// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { defineComponent, ref } from 'vue';

import { useAppQuery } from '../useAppQuery';

import type { AppQueryOptions } from '../useAppQuery';

// * The wrapper's job is what it hands to Pinia Colada and whether it wires error handling —
// * so the error-handling seam is the mock, and Colada itself stays real.
const { setupQueryErrorHandling } = vi.hoisted(() => ({
  setupQueryErrorHandling: vi.fn<(...args: unknown[]) => void>()
}));

mockNuxtImport('setupQueryErrorHandling', () => setupQueryErrorHandling);

function mountQuery<T>(options: AppQueryOptions<T>) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const query = useAppQuery<T>(options);

        return { query };
      },
      template: '<div />'
    }),
    { global: { plugins: [createPinia(), PiniaColada] } }
  );

  return wrapper.vm.query;
}

describe('useAppQuery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setupQueryErrorHandling.mockClear();
  });

  it('resolves the query and exposes its data', async () => {
    const query = mountQuery({
      key: ['things', 'plain'],
      query: () => Promise.resolve('loaded')
    });

    await flushPromises();

    expect(query.data.value).toBe('loaded');
  });

  it('holds the previous data while the next key loads', async () => {
    const id = ref(1);
    let resolveSecond!: (value: string) => void;

    const query = mountQuery({
      key: () => ['things', 'by-id', id.value],
      query: () =>
        id.value === 1
          ? Promise.resolve('thing 1')
          : new Promise<string>((resolve) => {
              resolveSecond = resolve;
            })
    });

    await flushPromises();
    expect(query.data.value).toBe('thing 1');

    id.value = 2;
    await flushPromises();

    // * The point of placeholderData: mid-flight the view still shows the previous page
    // * instead of flashing empty.
    expect(query.data.value).toBe('thing 1');

    resolveSecond('thing 2');
    await flushPromises();

    expect(query.data.value).toBe('thing 2');
  });

  it('lets the caller replace the placeholder behaviour', async () => {
    const query = mountQuery({
      key: ['things', 'placeholder-override'],
      query: () => Promise.resolve('loaded'),
      placeholderData: () => 'placeholder'
    });

    expect(query.data.value).toBe('placeholder');
  });

  it('wires central error handling when called from a component', () => {
    mountQuery({
      key: ['things', 'wired'],
      query: () => Promise.resolve('loaded')
    });

    expect(setupQueryErrorHandling).toHaveBeenCalledOnce();
  });

  it('passes the caller error-handling options to the handler', () => {
    mountQuery({
      key: ['things', 'options'],
      query: () => Promise.resolve('loaded'),
      errorHandling: { hideValidationToast: true }
    });

    expect(setupQueryErrorHandling.mock.calls[0]?.[1]).toEqual({
      hideValidationToast: true
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

    useAppQuery({
      key: ['things', 'unscoped'],
      query: () => Promise.resolve('loaded')
    });

    await flushPromises();
    wrapper.unmount();

    expect(setupQueryErrorHandling).not.toHaveBeenCalled();
  });
});
