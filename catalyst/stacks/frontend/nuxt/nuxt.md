# Stack: Frontend — Nuxt

**Layer:** Frontend
**Tool:** Nuxt 4 · Vue 3 · TypeScript
**Requires:** _lang/typescript · frontend/_vue · frontend/_common

The Vue-side frontend module: a Nuxt 4 app running **as an SPA** (`ssr: false`) — pages render on the client and the app deploys as static assets against a separate API. Server-side rendering is the `ssr` addon, adopted when it earns its keep (SEO, fast first paint on content pages, server-side data composition); an authenticated app behind a login usually does not need it, and a cookie-session API pairing is simpler without it. Binds the Universal Rules (Client And UI) to Nuxt; never restates a Universal Rule.

- Data fetching goes through the two-layer data access described in `data-layer.md` — a pure service function per endpoint, a Pinia Colada composable per operation. Nuxt's own `useFetch` / `useAsyncData` are SSR-oriented and are not the default here; they come into play with the `ssr` addon.
- Every response is parsed against a Zod schema rather than asserted with a generic — a removed or renamed field fails at the boundary, not three components deep.
- Forms: Regle for client-side rules, mirroring the backend's validation for the endpoint. Server 422s render inline on the field, never as a toast.
- Errors are handled centrally, once, at the query layer — components carry no try-catch and no manual loading flags.
- Client state is Pinia, and only what no server owns (`client-state.md`); server-owned data stays in Pinia Colada rather than being mirrored into a store.
- Styling and component primitives are the `frontend/ui` choice.
- Tests: Vitest with `@nuxt/test-utils` and Vue Test Utils.

## Module Documents

| Document | What it holds |
| --- | --- |
| `nuxt.md` | This document — the module contract and approved libraries |
| `data-layer.md` | The two-layer service + Pinia Colada contract, query keys, cache invalidation |
| `client-state.md` | Pinia stores — what belongs in one, store shape, and the server-state boundary |
| `validation.md` | Zod for responses, Regle for requests, and the inline-not-toast 422 path |
| `error-handling.md` | The fetcher, CSRF retry, and the central error policy |
| `routing.md` | Pages, layouts, and middleware-as-thin-adapter |

The shared tiers `_lang/typescript`, `frontend/_vue`, and `frontend/_common` travel with this module and hold the language-level, Vue-general, and framework-agnostic frontend conventions; the style guide `../_vue/vue-style.md` is the authoritative Vue style rules.

## Approved Libraries

- Nuxt 4, Vue 3, TypeScript.
- Pinia and `@pinia/colada` (with `@pinia/colada-nuxt`) — client state and server state respectively.
- Zod (response schemas); `@regle/core` + `@regle/rules` (form validation).
- `@vueuse/core`.
- Vitest, `@nuxt/test-utils`, `@vue/test-utils`.
- pnpm as the package manager.

## Avoid By Default

- `useFetch` / `useAsyncData` for application data — the data layer owns fetching, and these bypass its caching, error handling, and schema parsing. They are the `ssr` addon's tools.
- Raw `useQuery` / `useMutation` from Pinia Colada — always the project's `useAppQuery` / `useAppMutation` wrappers, which is where central error handling attaches.
- Mirroring server-owned data into a Pinia store — Pinia Colada owns server state; stores hold client state.
- Manual `ref()` loading flags and per-component try-catch around API calls.
- Asserting response shapes with `fetcher<T>()` generics instead of parsing them.
