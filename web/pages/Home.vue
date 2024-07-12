<template>
  <UContainer>
    <UTable />
  </UContainer>
</template>

<script setup lang="ts">
const ui = /* ui */ {
  //
};

onMounted(() => {
  loadUsers();
});

function loadUsers() {
  fetch('/users')
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
}
</script>
