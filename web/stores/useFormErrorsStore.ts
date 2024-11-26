import { defineStore } from 'pinia';

export const useFormErrorsStore = defineStore('form-errors', () => {
  const formErrors = ref({});

  function setFormErrors(errors: Record<string, string>) {
    formErrors.value = Object.assign({}, errors);
  }

  function clearFormErrors() {
    formErrors.value = {};
  }

  return { formErrors, setFormErrors, clearFormErrors };
});
