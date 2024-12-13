import { defineStore } from 'pinia';

export const useFormErrorsStore = defineStore('form-errors', () => {
  const formErrors = ref<any>({});

  function setFormErrors(errors: Record<string, string>) {
    formErrors.value = Object.assign({}, errors);
  }

  function clearFormErrors() {
    formErrors.value = {};
  }

  function setFormError(error: any) {
    formErrors.value[error.field] = error.message as string;
  }

  function clearFormError(field: any) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete formErrors.value[field];
  }

  return {
    formErrors,
    setFormErrors,
    setFormError,
    clearFormErrors,
    clearFormError
  };
});
