import type { FormFieldConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    root: '',
    wrapper: '',
    labelWrapper: 'flex content-center items-center justify-between gap-1',
    label: 'block font-medium text-default',
    container: [
      'relative',
      // * Changes: reserve the error line's height. Nuxt UI only renders the error when there is one, so a message appearing would otherwise shift every field below it — the reserved band is what the headless UIField got from a min-height.
      'pb-7'
    ],
    description: 'text-muted',
    error: [
      'mt-2 text-error',
      // * Changes: sits in the band `container` reserves rather than adding height when it appears.
      'absolute inset-x-0 bottom-0 mt-0'
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
