import { useToast, TYPE } from 'vue-toastification';
import type { PluginOptions } from 'vue-toastification';

type ToastType = 'success' | 'error' | 'default' | 'info' | 'warning';

export function $toast(
  message: string,
  type: ToastType = 'success',
  options: PluginOptions = {}
) {
  // * Resolved per call so the module never touches the toast interface before the plugin installs it.
  const toast = useToast();

  toast(message, {
    type: TYPE[type.toUpperCase() as keyof typeof TYPE],
    ...options
  });
}
