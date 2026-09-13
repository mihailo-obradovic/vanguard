<template>
  <!-- * Outside the default layout's height chain, so it sizes itself: `100dvh`, never `100vh`, so mobile browser chrome cannot clip it (`catalyst/stacks/frontend/nuxt/page-layout.md`). It scrolls itself because main.css pins the body to `overflow-y: hidden` — a card taller than a short landscape screen would otherwise be cut off with no way to reach its end. -->
  <!-- ! The centring fills UIScrollArea's content wrapper (`[&>div]`), not the viewport: the region reserves a 1px edge on each side, so a `min-h-dvh` child ran 2px past it, scrolled, and lit the bottom scroll-edge rule on a page with nothing below. -->
  <UIScrollArea class="bg-background h-dvh [&>div]:flex [&>div]:min-h-full">
    <div class="flex flex-1 items-center justify-center p-4">
      <slot />
    </div>
  </UIScrollArea>
</template>
