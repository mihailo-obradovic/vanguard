import type { ExternalToast } from 'vue-sonner';
import { toast } from 'vue-sonner';

type ToastType = 'success' | 'error' | 'default' | 'info' | 'warning';

// * The one seam every call site uses, so the toast library stays swappable behind it — this
// * signature survived the move off vue-toastification untouched. vue-sonner needs no plugin
// * install, so `toast` is imported at module scope rather than resolved per call.
export function $toast(
  message: string,
  type: ToastType = 'success',
  options: ExternalToast = {}
) {
  // * vue-sonner exposes each type as its own method and the untyped toast as the callable itself.
  if (type === 'default') {
    toast(message, options);

    return;
  }

  toast[type](message, options);
}
