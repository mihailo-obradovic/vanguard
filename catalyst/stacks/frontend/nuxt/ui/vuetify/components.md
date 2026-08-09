# Vuetify Composition Patterns

**Layer:** Frontend / UI
**Tool:** Vuetify 4

How to compose with the library rather than around it. The rule underneath all of it: **use Vuetify components directly, and extract a shared primitive only when a composition repeats or when the project adds real behaviour.**

## Which primitives earn their place

Small and worth building early:

| Primitive               | Why it earns its place                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A **dialog base**       | `v-dialog` + `v-card` + a title/body/actions layout repeats in every dialog; the base fixes the shape and the button row once             |
| A **confirm dialog**    | Wraps the base for the yes/no case, so a destructive action is one component and not fifteen lines                                        |
| A **loading indicator** | `v-progress-circular` plus the fill-height and centring behaviour the app wants                                                           |
| A **password field**    | Adds the visibility toggle; a second `defineModel` lets a password and its confirmation share one toggle so revealing either reveals both |

Usually not worth it: a wrapper around `v-btn`, `v-text-field`, or `v-card` that forwards props unchanged.

**A layout/gap wrapper is a judgement call.** A polymorphic component rendering `d-flex` with a configurable gap and direction reads well and removes repetition — but Vuetify's utility classes already express it inline. Build it if the repetition is real, and note that a polymorphic `:is` needs its target components imported explicitly (`setup.md`).

## The dialog base

Model the open state as `defineModel<boolean>({ required: true })` so a parent binds with `v-model` and never manages a separate ref. Give it `title`, `default`, and `actions` slots, a default Cancel/Confirm button row that the `actions` slot replaces, and props for `width`, `scrollable`, `loading`, and `confirmDisabled`. Emit `cancel` and `confirm` rather than taking callback props.

A fullscreen variant is the same component with `fullscreen` and a `v-toolbar` instead of a card title — worth a separate component rather than a `fullscreen` prop, because the internal structure genuinely differs.

## Forms: Regle needs no adapter

Vuetify's `:error-messages` takes a `string[]`, and Regle's `$errors` **is** a `string[]`:

```vue
<v-text-field
  v-model="form.name"
  :error-messages="r$.name.$errors"
  label="Name"
  required
/>
```

That is the whole integration. A project on this UI choice does **not** need the field-error presenter component the headless choice builds — Vuetify's inputs already reserve the message row, so there is no layout shift to design around either.

Everything else in `../../validation.md` applies unchanged.

## Theme switching

`useTheme()` from `vuetify` toggles the theme, but under `ssr: false` there is no server render to pick the stored preference, so the app paints its default theme first and must correct after mount:

```ts
const theme = useTheme();
const themeSetting = useCookie('theme');
const isDark = computed(() => theme.global.current.value.dark);

function toggleTheme() {
  theme.toggle();
}

watch(isDark, (value) => {
  themeSetting.value = value ? 'dark' : 'light';
});

onMounted(() => {
  theme.change(themeSetting.value || 'light');
});
```

Track `theme.global.current`, not `theme.current` — `change()` and `toggle()` mutate the global theme, while `theme.current` is contextual and diverges from it inside a `v-theme-provider`.

`useCookie` rather than `localStorage` so the value is available to the server if the `ssr` addon is ever adopted.

Wrap this in a local composable at the bottom of the layout file (`../../../_vue/vue-style.md`, section 21) rather than scattering the four pieces through the script.

## The layout skeleton

`v-layout` wraps the app; `v-app-bar` and `v-navigation-drawer` register themselves with it and reserve their space automatically, which is why `v-main` needs no manual offsets. Navigation items belong in a `computed` so role-conditional entries filter in one place rather than through `v-if` on each item.

Keep a second, near-empty layout for standalone pages — a centred `v-layout` with no chrome (`../../routing.md`, Layouts).

## On borrowing compositions from a reference implementation

The wiring, theme shape, primitives, and bindings above are portable; a reference app's specific product decisions are not. A UI composition that reaches into route policy or server config — e.g. authentication in layout-mounted dialogs, which removes the login/register routes (`../../routing.md`) and can force the backend to change the URLs it emails — is a decision record, not a styling preference.
