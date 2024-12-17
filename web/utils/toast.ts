import { useToast, TYPE } from 'vue-toastification';

type ToastType = 'success' | 'error' | 'default' | 'info' | 'warning';

const toast = useToast();

export function $toast(
  message: string,
  type: ToastType = 'success',
  options: any = {}
) {
  toast(message, {
    type: TYPE[type.toUpperCase() as keyof typeof TYPE],
    ...options
  });
}
