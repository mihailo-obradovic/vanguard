# Nuxt Data Layer

**Layer:** Frontend
**Tool:** Pinia Colada · Zod

All API communication goes through two layers. Adding endpoints for a new resource means creating **both** files — a service file and a query file. Nothing in a component calls the network directly.

## 1. Service file — `@/services/<resource>.api.ts`

Pure async functions over `fetcher<T>()`, one per endpoint. Named `fetchItems` / `fetchItem`, `createItem`, `updateItem`, `deleteItem`.

- **No side effects beyond the HTTP call.** No store access, no toasts, no navigation, no cache writes.
- Every non-void response is **parsed, not asserted**: `parseResponse(Schema, await fetcher(url))`. Never `fetcher<T>()` with a type argument — that is a lie the compiler believes. Void endpoints (a `DELETE` returning 204) skip parsing.
- Response-only schemas — shapes used nowhere but this file — sit at the top of the service file. Domain schemas live with the types they produce in `@/types/` (`validation.md`).
- Unwrap envelopes here, not in components: an API that wraps single resources in `{ data: … }` gets `.data` applied at the service boundary so every consumer sees the model.

## 2. Query file — `@/services/queries/use<Resource>Queries.ts`

Named after the service file, one per service file. It holds three things:

**A query-key const.** Hierarchical keys for every query, declared `as const`. Queries only — mutations take no `key`: in Pinia Colada it is optional and exists solely for mutation-cache introspection, which nothing in this project uses.

```ts
export const usersQueryKeys = {
  fetchUsers: ['users', 'fetch'],
  fetchUser: ['users', 'get']
} as const;
```

Parameterized keys append their params in the composable: `key: () => [...usersQueryKeys.fetchUser, id.value]`.

**One composable per operation**, built on the project's `useAppQuery` / `useAppMutation` wrappers — **never raw `useQuery` / `useMutation`**, because the wrappers are where central error handling attaches (`error-handling.md`). Reactive params come in as `Ref`s so the key can track them:

```ts
export function useFetchUser(
  id: Ref<number>,
  options: QueryOptions<User> = {}
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
2. **Chain the caller's hook last**, after the internal work — and **await the internal work first**, or a caller reading the store or the cache sees the state as it was before the composable updated it.

Rule 2 is `chainAfter(internal, caller)`, a project util, rather than a chain hand-written per composable. Its argument list comes from the caller's hook, so an internal hook declares only the arguments it reads:

```ts
export function useUpdateUser(
  options: MutationOptions<User, { id: number; userData: UpdateUserForm }> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: ({ id, userData }) => updateUser(id, userData),
    ...options,
    onSettled: chainAfter(async (_data, _error, vars) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({
        key: [...usersQueryKeys.fetchUser, vars.id]
      });
    }, options.onSettled)
  });
}
```

The signature says `MutationOptions<TData, TVars>` — exported beside `useAppMutation`, and `QueryOptions<T>` beside `useAppQuery` — rather than repeating `Omit<AppMutationOptions<TData, TVars>, 'key' | 'mutation'>` at every composable. The `Omit` is the point of the alias: `mutation`/`query` and `key` are the composable's own to declare, never the caller's to replace.

**Test the await, not just the order.** An internal hook whose effect is synchronous (`setUser(data)`) runs in order whether or not it is awaited, and an invalidation asserts the refetch was _sent_, not that it finished — so a composable-level spec can pass with the `await` removed. The guarantee is pinned once, in `chainAfter`'s own spec, with a deliberately slow internal hook.

**Store side effects belong to the query layer's internal hook**, not to services and not to components — syncing the authenticated user after a login is the composable's job.

## The wrappers

`@/composables/useAppQuery.ts` and `useAppMutation.ts` wrap Pinia Colada, add central error handling, and take an extra `errorHandling` option that callers use to opt out of toasts:

```ts
export type AppQueryOptions<T> = UseQueryOptions<T> & {
  errorHandling?: ErrorHandlingOptions;
};
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

## Pinia Colada semantics

What the library's surface actually means, so state is read and caches are managed correctly.

### Query state

A query exposes two orthogonal statuses — one about the **data**, one about the **request**:

- `status` (`'pending' | 'success' | 'error'`) describes the data: `pending` means no data has ever arrived. `data` and `error` are its companions.
- `asyncStatus` (`'idle' | 'loading'`) describes the request: `loading` means a fetch is in flight right now, including background refetches.

The derived flags follow from that split: `isPending` (no data yet — first load) vs `isLoading` (a request is running — any load). A first-visit skeleton keys off `isPending`; a background-refresh indicator keys off `isLoading`. Because the wrappers set `placeholderData`, a query showing the previous page's data is `success` with `isPlaceholderData: true` — check that flag when stale-but-visible needs different treatment.

For TypeScript narrowing, read through the grouped `state` object: inside `state.status === 'error'` the type of `state.error` excludes `null`, and in the success branch `state.data` excludes `undefined`.

### Freshness and refetching

- A query is **stale** once `staleTime` (default 5 s) has passed since its last fetch. Stale queries refetch automatically when a component mounts them or their key changes; fresh ones are served from cache.
- `refresh()` fetches **only if stale** — prefer it. `refetch()` fetches unconditionally — reserve it for an explicit "reload" affordance.
- `gcTime` (default 5 min) is how long an **unused** entry stays cached after the last component unmounts it. Override either per query only with a reason (e.g. long `staleTime` for near-static reference data).

### Dependent queries

When a query's params aren't available yet (route not resolved, parent query still pending), pass a reactive `enabled` instead of guarding at the call site: `enabled: () => id.value != null`. A disabled query holds `pending` and fires as soon as the condition turns true.

### Invalidation semantics

`invalidateQueries({ key })` matches the key **and all its children** — `['users']` hits `['users', 'fetch']` and every `['users', 'get', id]`. Pass `exact: true` to match a single entry. Invalidation marks matching entries stale and refetches the **active** ones (currently mounted); inactive entries refetch when next used. That is why mutations can invalidate broadly without triggering a request storm.

### Mutation state and cache writes

- `mutate` catches the mutation's error itself (it lands in `error` and the central handler); `mutateAsync` also **rethrows**, so an un-caught `mutateAsync` call is an unhandled rejection — another reason the component rules default to `mutate`.
- A mutation exposes `isLoading`, `error`, `data`, and `reset()` (clears error and data back to the initial state — useful when a dialog reopens).
- The cache is directly writable — `queryCache.getQueryData(key)` / `setQueryData(key, data)` — which is how optimistic updates are built. The project's default is **invalidation, not manual cache writes**; reach for `setQueryData` only deliberately, and never from a component (the query layer owns the cache).

## Component rules

- Import query composables explicitly from `@/services/queries/…` and consume their state: `data`, `error`, and `isLoading` / `asyncStatus` for spinners and disabled buttons. **Never add a manual `ref()` loading flag.**
- **No try-catch around queries and mutations.** Errors are handled centrally. Opt out of the toast per call with `errorHandling: { suppressToasts: 'all' }`.
- Success toasts, navigation, and closing dialogs go in the page-level `onSuccess` passed to the composable.
- Trigger mutations with `mutate` (fire-and-forget) rather than `mutateAsync`, unless the result is needed inline.
