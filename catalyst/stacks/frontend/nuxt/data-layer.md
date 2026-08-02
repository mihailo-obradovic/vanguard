# Nuxt Data Layer

**Layer:** Frontend
**Tool:** Pinia Colada · Zod

All API communication goes through two layers. Adding endpoints for a new resource means creating **both** files — a service file and a query file. Nothing in a component calls the network directly.

The split exists so that the thing which talks HTTP has no opinions (no store access, no toasts, no navigation) and the thing which has opinions never talks HTTP. That is what makes services trivially testable and queries trivially cacheable.

## 1. Service file — `@/services/<resource>.api.ts`

Pure async functions over `fetcher<T>()`, one per endpoint. Named `fetchItems` / `fetchItem`, `createItem`, `updateItem`, `deleteItem`.

- **No side effects beyond the HTTP call.** No store access, no toasts, no navigation, no cache writes.
- Every non-void response is **parsed, not asserted**: `parseResponse(Schema, await fetcher(url))`. Never `fetcher<T>()` with a type argument — that is a lie the compiler believes. Void endpoints (a `DELETE` returning 204) skip parsing.
- Response-only schemas — shapes used nowhere but this file — sit at the top of the service file. Domain schemas live with the types they produce in `@/types/` (`validation.md`).
- Unwrap envelopes here, not in components: an API that wraps single resources in `{ data: … }` gets `.data` applied at the service boundary so every consumer sees the model.

## 2. Query file — `@/services/queries/use<Resource>Queries.ts`

Named after the service file, one per service file. It holds three things:

**A query-key const.** Hierarchical keys for every operation, declared `as const`:

```ts
export const usersQueryKeys = {
  fetchUsers: ['users', 'fetch'],
  fetchUser: ['users', 'get'],
  createUser: ['users', 'create'],
  updateUser: ['users', 'update'],
  deleteUser: ['users', 'delete']
} as const;
```

Parameterized keys append their params in the composable: `key: () => [...usersQueryKeys.fetchUser, id.value]`.

**One composable per operation**, built on the project's `useAppQuery` / `useAppMutation` wrappers — **never raw `useQuery` / `useMutation`**, because the wrappers are where central error handling attaches (`error-handling.md`). Reactive params come in as `Ref`s so the key can track them:

```ts
export function useFetchUser(
  id: Ref<number>,
  options: Omit<AppQueryOptions<User>, 'key' | 'query'> = {}
) {
  return useAppQuery<User>({
    key: () => [...usersQueryKeys.fetchUser, id.value],
    query: () => fetchUser(id.value),
    ...options
  });
}
```

**Cache invalidation in `onSettled`.** Mutations invalidate every affected key; components never patch cached lists by hand.

## The options passthrough

Every composable takes an `options` passthrough so a caller can add its own `onSuccess` / `onSettled`. Two rules make that safe:

1. **Spread the caller's options first, then declare the internal hook** — otherwise the caller silently overwrites the invalidation the composable exists to guarantee.
2. **Chain the caller's hook last**, after the internal work: `await options.onSettled?.(data, error, vars, context)`.

```ts
export function useUpdateUser(options: /* … */ = {}) {
  const queryCache = useQueryCache();

  return useAppMutation({
    key: usersQueryKeys.updateUser,
    mutation: ({ id, userData }) => updateUser(id, userData),
    ...options,
    onSettled: async (data, error, vars, context) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({ key: [...usersQueryKeys.fetchUser, vars.id] });
      await options.onSettled?.(data, error, vars, context);
    }
  });
}
```

**Store side effects belong to the query layer's internal hook**, not to services and not to components — syncing the authenticated user after a login is the composable's job.

## The wrappers

`@/composables/useAppQuery.ts` and `useAppMutation.ts` wrap Pinia Colada, add central error handling, and take an extra `errorHandling` option that callers use to opt out of toasts:

```ts
export type AppQueryOptions<T> = UseQueryOptions<T> & { errorHandling?: ErrorHandlingOptions };
```

Two details that are load-bearing:

- **`placeholderData: (prev) => prev`** on queries keeps the previous page's data visible while the next one loads, so switching pages or filters does not flash empty.
- **Guard the error-handling setup with `getCurrentInstance()`** so a composable called outside a component's setup does not crash on the watcher it would otherwise register.

Augment Pinia Colada's error type once, project-wide, so every `error` is typed as the fetcher's error rather than `unknown`:

```ts
declare module '@pinia/colada' {
  interface TypesConfig {
    defaultError: FetchError;
  }
}
```

## Component rules

- Import query composables explicitly from `@/services/queries/…` and consume their state: `data`, `error`, and `isLoading` / `asyncStatus` for spinners and disabled buttons. **Never add a manual `ref()` loading flag.**
- **No try-catch around queries and mutations.** Errors are handled centrally. Opt out of the toast per call with `errorHandling: { hideToast: true }`.
- Success toasts, navigation, and closing dialogs go in the page-level `onSuccess` passed to the composable.
- Trigger mutations with `mutate` (fire-and-forget) rather than `mutateAsync`, unless the result is needed inline.
