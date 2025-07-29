import { useToast, TYPE } from 'vue-toastification';
import type { PluginOptions } from 'vue-toastification';

type ToastType = 'success' | 'error' | 'default' | 'info' | 'warning';

const toast = useToast();

export function $toast(
  message: string,
  type: ToastType = 'success',
  options: PluginOptions = {}
) {
  toast(message, {
    type: TYPE[type.toUpperCase() as keyof typeof TYPE],
    ...options
  });
}
