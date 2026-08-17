<template>
  <div v-if="open" class="ui-dialog-overlay" @click="emit('close')">
    <div
      ref="panel"
      class="ui-dialog"
      :class="{ narrow }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @click.stop
      @keydown.esc="emit('close')"
      @keydown.tab="handleTab"
    >
      <div class="ui-dialog-header">
        <h2 :id="titleId" class="ui-dialog-title" :class="{ danger }">
          {{ title }}
        </h2>
      </div>

      <div class="ui-dialog-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  // * The width a short dialog wants — a confirmation, not a form.
  narrow?: boolean;
  // * A destructive dialog: the title carries the warning colour.
  danger?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const panel = useTemplateRef<HTMLElement>('panel');

const titleId = useId();

// * The control the dialog was opened from, so closing can hand focus back to it.
let opener: HTMLElement | null = null;

// ! Snapshotted while the opener is still in the document, never walked at close time: Vue detaches a removed row from its parent, so a dead opener's chain ends at `null` before it ever reaches the table that survived.
let openerAncestors: HTMLElement[] = [];

// * Stops below `<body>`: a dialog whose whole opening region is gone leaves focus where the browser put it rather than annotating the page's root.
function ancestorsOf(element: HTMLElement | null) {
  const chain: HTMLElement[] = [];

  let current = element?.parentElement ?? null;

  while (
    current &&
    current !== document.body &&
    document.body.contains(current)
  ) {
    chain.push(current);
    current = current.parentElement;
  }

  return chain;
}

// * A container is not focusable on its own, and the attribute is dropped again the moment focus leaves it — a shared primitive should leave no mark on markup it does not own.
function focusRegion(element: HTMLElement) {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');

    element.addEventListener(
      'blur',
      () => element.removeAttribute('tabindex'),
      {
        once: true
      }
    );
  }

  element.focus();
}

// ! `.focus()` on a detached node is a silent no-op, which is how closing a dialog over a refetched list used to drop the user on `<body>`: the row holding the opener is gone by the time the dialog closes.
function restoreFocus() {
  if (opener?.isConnected) {
    opener.focus();

    return;
  }

  const region = openerAncestors.find((element) => element.isConnected);

  if (region) focusRegion(region);
}

// * Recomputed per keypress rather than cached on open: the submit button is disabled until the form is valid, and a disabled button is not a tab stop.
function focusableWithin() {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return [...(panel.value?.querySelectorAll<HTMLElement>(selector) ?? [])];
}

// ! The trap is the whole point of owning a dialog rather than styling a div: without it Tab walks
// ! out of the open dialog into the page behind it, which is still there and still clickable.
function handleTab(event: KeyboardEvent) {
  const focusable = focusableWithin();
  const first = focusable[0];
  const last = focusable.at(-1);

  // * A dialog with nothing focusable in it has no cycle to keep Tab inside; the panel itself holds focus and Tab is left to the browser.
  if (!first || !last) return;

  const active = document.activeElement;

  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault();
    last.focus();

    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

// * Focus moves to the panel rather than the first field: a screen reader then reads the dialog's own name before its contents, and Tab from there reaches the first field anyway.
watch(
  () => props.open,
  async (open) => {
    if (open) {
      opener = document.activeElement as HTMLElement | null;
      openerAncestors = ancestorsOf(opener);

      await nextTick();
      panel.value?.focus();

      return;
    }

    // ! Restoring this is what keeps a keyboard user where they were; without it focus falls to
    // ! `<body>` on close and the next Tab starts again from the top of the page.
    restoreFocus();

    opener = null;
    openerAncestors = [];
  }
);
</script>

<style scoped>
.ui-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.ui-dialog {
  background: var(--color-surface);
  border-radius: var(--radius);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-card);
}

.ui-dialog.narrow {
  max-width: 400px;
}

/* * The panel is focused programmatically on open; the visible focus ring belongs on the controls inside, not the dialog itself. */
.ui-dialog:focus {
  outline: none;
}

.ui-dialog-header {
  padding: 24px 24px 0 24px;
}

.ui-dialog-title {
  margin: 0;
  color: var(--color-brand);
  font-size: 24px;
  font-weight: 600;
}

.ui-dialog-title.danger {
  color: var(--color-danger);
}

.ui-dialog-body {
  padding: 16px 24px 0 24px;
}
</style>
