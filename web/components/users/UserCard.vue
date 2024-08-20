<template>
  <v-row no-gutters>
    <v-col cols="12" md="6">
      <GapContainer type="VSheet" class="pa-4 rounded-lg" column elevation="1">
        <GapContainer class="justify-space-between mb-2">
          <h2>Profile</h2>

          <GapContainer>
            <v-btn
              v-if="editMode"
              class="rounded"
              icon
              variant="flat"
              color="error"
              size="small"
              @click="resetForm"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>

            <v-btn
              v-if="!editMode"
              class="rounded"
              icon
              variant="flat"
              color="primary"
              size="small"
              @click="editMode = true"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              v-else
              class="rounded"
              icon
              variant="flat"
              color="success"
              size="small"
              :loading="isLoading"
              @click="handleSubmit"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </GapContainer>
        </GapContainer>

        <GapContainer column class="w-100">
          <v-text-field
            v-model="form.name"
            label="Name"
            variant="outlined"
            :readonly="!editMode"
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            variant="outlined"
            :readonly="!editMode"
          />
        </GapContainer>
      </GapContainer>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update']);

const { isLoading } = storeToRefs(useLoadingStore());

const editMode = ref(false);

const initialForm = {
  name: props.user.name,
  email: props.user.email
};

const form = ref(Object.assign({}, initialForm));

function resetForm() {
  editMode.value = false;

  Object.assign(form.value, initialForm);
}

function handleSubmit() {
  emit('update', form.value);
}

defineExpose({ resetForm });
</script>
