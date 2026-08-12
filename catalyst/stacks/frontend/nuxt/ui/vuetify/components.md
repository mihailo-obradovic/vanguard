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

A fullscreen variant is the same component with `fullscreen` and a `v-toolbar` instead of a card title — worth a separate component rather than a `fullscreen` prop, because the internal structure genuinely differs. Keep the toolbar outside the scrolling region (`v-card-text` scrolls, the toolbar does not) so the title and close affordance stay visible however long the content is.

### Scrolling and phones

- **`scrollable` on `v-dialog` is the scrolling mechanism** — it pins the card's title and actions and confines overflow to `v-card-text`. Hand-rolled `max-height`/`overflow` CSS on the card re-implements this worse.
- **Scroll borders only while content actually overflows.** A permanent border above the actions reads as decoration; one that appears with overflow reads as "there is more". Watch both the scroll container and its content with `useResizeObserver` and compare `scrollHeight` to `clientHeight` — observing only the container misses slot content growing inside it.
- **Snap dialogs to fullscreen below the `xs` breakpoint** (`useDisplay().xs` — not Vuetify's `mobile`, which flags everything under 1280px), with an opt-out prop for dialogs that should stay cards. The confirm dialog uses the opt-out: a two-button question does not earn the whole screen.

### Keyboard contract

- **Enter confirms, Esc cancels.** `v-dialog` owns Esc already; bind Enter on the card (`@keydown.enter`) and skip it when the confirm is disabled or loading, and when the event target is an interactive element (`button, a, textarea, .v-select`) — those handle Enter themselves, and confirming as well would double-fire.
- **Destructive confirms opt out of Enter** and color the confirm button `error`. A delete should take a pointed click, not a stray keypress — the confirm dialog exposes a `destructive` prop that sets both.

### Closing is a transition, not an event

`v-dialog` fades out; the dialog's content is visible the whole time. Two rules follow:

- **State the dialog renders outlives the open flag.** A delete confirmation whose message derives from the record being deleted keeps its own snapshot ref; clearing it when the open flag flips empties the message mid-fade.
- **Re-emit `after-leave`** from `v-dialog` — it fires once the close transition finishes and is the safe moment for owners to clear that snapshot, and for constant-initial-state forms to reset (`../../validation.md`, the dialog reset rule).

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

## Sizing to the viewport

**Measure, don't assume.** An element capped with hardcoded `calc(100vh - 64px - …)` math encodes the app bar's height, its own offset, and every sibling above it — and silently breaks when any of them changes. Measure instead:

```ts
const { top } = useElementBounding(root, { windowScroll: false });

const maxHeight = computed(
  () => `calc(100dvh - ${top.value}px - var(--v-layout-bottom, 0px))`
);
```

- `useElementBounding` (VueUse) gives the element's actual top, whatever ended up above it; `windowScroll: false` stops the value from tracking page scroll.
- **`100dvh`, not `100vh`** — mobile browser chrome makes `100vh` overflow the visible viewport.
- **`var(--v-layout-bottom)`** is Vuetify's own accounting for layout-registered footers and bottom bars — read it rather than restating a footer height.
- Apply the result in a scoped style via `v-bind(maxHeight)` when the target is inside a Vuetify component's internals (e.g. `:deep(.v-table__wrapper)`) — a justified exception to the deep-selector caution in [`vuetify.md`](vuetify.md), since `v-table` exposes no height prop.

**The layout publishes the spacing it applies.** A descendant must not guess the page container's bottom gap (or find "some" container with `closest('.v-container')`). The layout defines a CSS variable on its page container and derives the actual padding from it, so the applied gap and the published value can never disagree:

```scss
.page-container {
  --page-padding-bottom: #{settings.$container-padding-x};

  padding-bottom: var(--page-padding-bottom);
}
```

Descendants then subtract `var(--page-padding-bottom, 0px)` — the fallback keeps them usable outside that layout.

Two compositions this pays for:

- **A table capped at the page**: `v-table fixed-header` plus the measured `max-height` on `.v-table__wrapper` gives a sticky header over a body that scrolls within the page, with no page-level scrollbar.
- **The loading indicator's `fillHeight`**: the same formula spans exactly the space below wherever the spinner landed, instead of a full-viewport overlay that centres relative to content it does not cover.

## On borrowing compositions from a reference implementation

The wiring, theme shape, primitives, and bindings above are portable; a reference app's specific product decisions are not. A UI composition that reaches into route policy or server config — e.g. authentication in layout-mounted dialogs, which removes the login/register routes (`../../routing.md`) and can force the backend to change the URLs it emails — is a decision record, not a styling preference.
