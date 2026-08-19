import type { Toast } from '@nuxt/ui/composables/useToast';

type ToastType = 'success' | 'error' | 'default' | 'info' | 'warning';

// * The colour each type name shows as. `default` maps to `neutral` rather than `primary`: an untyped message is an announcement, not a branded one, and the four named types are the ones carrying meaning.
const COLORS = {
  success: 'success',
  error: 'error',
  default: 'neutral',
  info: 'info',
  warning: 'warning'
} as const satisfies Record<ToastType, Toast['color']>;

export function $toast(
  message: string,
  type: ToastType = 'success',
  options: Partial<Toast> = {}
) {
  // * Resolved per call so the module never touches the toast interface before `<UApp>` provides it.
  const toast = useToast();

  toast.add({ title: message, color: COLORS[type], ...options });
}
