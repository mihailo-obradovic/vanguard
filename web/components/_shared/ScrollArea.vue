<template>
  <div
    ref="region"
    class="scroll-area"
    :class="[`axis-${axis}`, edgeClasses]"
    @scroll.passive="measure"
  >
    <div ref="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScrollAxis } from '@/utils/scrollEdges';

const props = withDefaults(defineProps<{ axis?: ScrollAxis }>(), {
  axis: 'vertical'
});

const region = useTemplateRef<HTMLElement>('region');
const content = useTemplateRef<HTMLElement>('content');

const edges = ref({ top: false, bottom: false, left: false, right: false });

const edgeClasses = computed(() => ({
  'edge-top': edges.value.top,
  'edge-bottom': edges.value.bottom,
  'edge-left': edges.value.left,
  'edge-right': edges.value.right
}));

// * The arithmetic lives in `utils/scrollEdges.ts` and is unit-tested there; this component is only the wiring.
function measure() {
  const element = region.value;

  if (!element) {
    return;
  }

  edges.value = scrollEdges(element, props.axis);
}

// ! Three sources, and missing any one leaves a border stale: the container resizing, the CONTENT resizing inside a container that never changed size (the common case in a dialog — observing only the container misses it entirely), and scroll itself, which is bound passively on the element above.
useResizeObserver([region, content], measure);

// * The first measurement cannot run until the slot has laid out.
onMounted(measure);
</script>

<style scoped>
.scroll-area {
  /* * The region owns its padding so the edge rules span it fully and content scrolls under them, rather than reading as a stray divider inset from the container. Consumers set the value. */
  overflow: hidden;
  /*
   * ! The 1px is reserved on every edge from the start and only its COLOUR changes. Toggling
   * border-width instead would move the content by a pixel each time an edge gained or lost its
   * rule — a scroll affordance that causes the layout shift `layout-stability.md` forbids.
   *
   * ! Never also carry a structural border: fusing a 1px affordance to a structural edge either
   * doubles the line or hides the affordance inside it. A bordered surface becomes a static shell
   * with this component inside it.
   */
  border: 1px solid transparent;
}

.axis-vertical,
.axis-both {
  overflow-y: auto;
}

.axis-horizontal,
.axis-both {
  overflow-x: auto;
}

.edge-top {
  border-top-color: var(--ui-scroll-edge);
}

.edge-bottom {
  border-bottom-color: var(--ui-scroll-edge);
}

.edge-left {
  border-left-color: var(--ui-scroll-edge);
}

.edge-right {
  border-right-color: var(--ui-scroll-edge);
}
</style>
