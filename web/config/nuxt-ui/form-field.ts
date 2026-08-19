import type { FormFieldConfig } from '../../types/nuxt-ui';

// * Changes: the error message's transition, named rather than written inline because only its enter half can live in a theme config. Nuxt UI unmounts the message the instant the error clears, so `components/_shared/UFormField.vue` holds it on screen for `ERROR_TRANSITION_MS` and applies the exit half through `ui.error` — one transition, kept in one place.
// ! The duration is written out inside each class as well as in the constant, and the two must agree. Tailwind generates a utility only for a candidate it can read literally in the source, so composing the class from the constant would leave the animation with no CSS behind it and no error to say so.
export const ERROR_TRANSITION_MS = 200;

const ERROR_ENTER_ANIMATION =
  'motion-safe:animate-[slide-in-from-top-and-fade_200ms_var(--ease-out)]';

export const ERROR_EXIT_ANIMATION =
  'motion-safe:animate-[slide-out-to-top-and-fade_200ms_var(--ease-out)]';

export default {
  slots: {
    root: '',
    wrapper: '',
    labelWrapper: 'flex content-center items-center justify-between gap-1',
    label: 'block font-medium text-default',
    container: [
      'relative',
      // * Changes: reserve the error line's height. Nuxt UI only renders the error when there is one, so a message appearing would otherwise shift every field below it — the reserved band is what the headless field primitive used to get from a min-height.
      // * 1.5rem is the `text-xs` line the error renders on plus the 0.5rem gap that separates it from the input.
      'pb-6'
    ],
    description: 'text-muted',
    error: [
      'mt-2 text-error',
      // * Changes: sits in the band `container` reserves rather than adding height when it appears, one step below the field's own size so the message reads as an annotation of the input rather than a second label.
      'absolute inset-x-0 bottom-0 mt-0 text-xs',
      // * Changes: eases the message in the way Vuetify's messages transition does — a short drop from above with a fade, rather than appearing at full opacity. The exit half is `ERROR_EXIT_ANIMATION` above.
      ERROR_ENTER_ANIMATION
    ],
    hint: 'text-muted',
    help: [
      'mt-2 text-muted',
      // * Changes: shares the reserved band with the error it alternates with.
      'absolute inset-x-0 bottom-0 mt-0'
    ]
  },
  variants: {
    size: {
      xs: {
        root: 'text-xs'
      },
      sm: {
        root: 'text-xs'
      },
      md: {
        root: 'text-sm'
      },
      lg: {
        root: 'text-sm'
      },
      xl: {
        root: 'text-base'
      }
    },
    required: {
      true: {
        label: "after:content-['*'] after:ms-0.5 after:text-error"
      }
    },
    orientation: {
      vertical: {
        container: 'mt-1'
      },
      horizontal: {
        root: 'flex justify-between place-items-baseline gap-2'
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
} satisfies FormFieldConfig;
