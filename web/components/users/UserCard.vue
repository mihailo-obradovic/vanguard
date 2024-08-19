<template>
  <v-row no-gutters>
    <v-col cols="12" md="6">
      <GapContainer type="VSheet" class="pa-4 rounded-lg" column elevation="1">
        <GapContainer>
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

          <v-btn
            class="rounded"
            icon
            variant="flat"
            color="primary"
            height="56"
            @click="editMode = !editMode"
          >
            <v-icon>
              {{ editMode ? 'mdi-close' : 'mdi-pencil' }}
            </v-icon>
          </v-btn>
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

const editMode = ref(false);

const initialForm = {
  name: props.user.name,
  email: props.user.email
};

const form = ref(Object.assign({}, initialForm));
</script>
