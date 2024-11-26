export default function handleError(error: any, performingAction: string) {
  const code = 123;
  const message = '123';

  let toastMessage = `Error ${performingAction}. `;

  switch (code) {
    case 500:
      toastMessage += 'Internal server error.';
      break;
    case 400:
      const isFormError = false;

      if (isFormError) {
        setFormErrors(message);

        return;
      }
    default:
      toastMessage += message;
      break;
  }

  $toast(toastMessage, 'error');
}

function setFormErrors(errors: Record<string, string>) {
  const { setFormErrors } = useFormErrorsStore();

  setFormErrors(errors);
}
