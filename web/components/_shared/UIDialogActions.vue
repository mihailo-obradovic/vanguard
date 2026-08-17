<template>
  <div class="ui-dialog-actions">
    <slot />
  </div>
</template>

<style scoped>
/* * Lives in the caller's content rather than in `UIDialog`'s own template, so a form dialog's submit button stays inside its `<form>` and still submits it. */
.ui-dialog-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #e9ecef;
  margin-top: 16px;
}
</style>
