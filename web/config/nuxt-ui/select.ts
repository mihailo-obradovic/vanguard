import type { SelectConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    base: [
      'relative group rounded-md inline-flex items-center disabled:cursor-not-allowed disabled:opacity-75',
      'transition-colors'
    ],
    leading: 'absolute inset-y-0 start-0 flex items-center',
    leadingIcon: 'shrink-0 text-dimmed',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailing: 'absolute inset-y-0 end-0 flex items-center',
    trailingIcon: 'shrink-0 text-dimmed',
    value: 'truncate pointer-events-none',
    placeholder: 'truncate text-dimmed',
    arrow: 'fill-bg stroke-default',
    content:
      'max-h-[min(15rem,var(--reka-select-content-available-height,15rem))] w-(--reka-select-trigger-width) bg-default shadow-lg rounded-md ring ring-default overflow-hidden origin-(--reka-select-content-transform-origin) pointer-events-auto flex flex-col',
    viewport:
      'relative divide-y divide-default scroll-py-1 overflow-y-auto flex-1',
    group: 'p-1 isolate',
    empty: 'text-center text-muted',
    label: 'font-semibold text-highlighted',
    separator: '-mx-1 my-1 h-px bg-border',
    item: [
      'group relative w-full flex items-start select-none outline-none before:absolute before:z-[-1] before:inset-px before:rounded-md data-disabled:cursor-not-allowed data-disabled:opacity-75 text-default data-highlighted:not-data-disabled:text-highlighted data-highlighted:not-data-disabled:before:bg-elevated/50',
      'transition-colors before:transition-colors'
    ],
    itemLeadingIcon: [
      'shrink-0 text-dimmed group-data-highlighted:not-group-data-disabled:text-default',
      'transition-colors'
    ],
    itemLeadingAvatar: 'shrink-0',
    itemLeadingAvatarSize: '',
    itemLeadingChip: 'shrink-0',
    itemLeadingChipSize: '',
    itemTrailing: 'ms-auto inline-flex gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemWrapper: 'flex-1 flex flex-col min-w-0',
    itemLabel: 'truncate',
    itemDescription: 'truncate text-muted'
  },
  variants: {
    fieldGroup: {
      horizontal:
        'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      vertical:
        'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
    },
    size: {
      xs: {
        base: 'px-2 py-1 text-xs gap-1',
        leading: 'ps-2',
        trailing: 'pe-2',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4',
        label: 'p-1 text-[10px]/3 gap-1',
        item: 'p-1 text-xs gap-1',
        itemLeadingIcon: 'size-4',
        itemLeadingAvatarSize: '3xs',
        itemLeadingChip: 'size-4',
        itemLeadingChipSize: 'sm',
        itemTrailingIcon: 'size-4',
        empty: 'p-2 text-xs'
      },
      sm: {
        base: 'px-2.5 py-1.5 text-xs gap-1.5',
        leading: 'ps-2.5',
        trailing: 'pe-2.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4',
        label: 'p-1.5 text-[10px]/3 gap-1.5',
        item: 'p-1.5 text-xs gap-1.5',
        itemLeadingIcon: 'size-4',
        itemLeadingAvatarSize: '3xs',
        itemLeadingChip: 'size-4',
        itemLeadingChipSize: 'sm',
        itemTrailingIcon: 'size-4',
        empty: 'p-2.5 text-xs'
      },
      md: {
        base: 'px-2.5 py-1.5 text-sm gap-1.5',
        leading: 'ps-2.5',
        trailing: 'pe-2.5',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5',
        label: 'p-1.5 text-xs gap-1.5',
        item: 'p-1.5 text-sm gap-1.5',
        itemLeadingIcon: 'size-5',
        itemLeadingAvatarSize: '2xs',
        itemLeadingChip: 'size-5',
        itemLeadingChipSize: 'md',
        itemTrailingIcon: 'size-5',
        empty: 'p-2.5 text-sm'
      },
      lg: {
        base: 'px-3 py-2 text-sm gap-2',
        leading: 'ps-3',
        trailing: 'pe-3',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5',
        label: 'p-2 text-xs gap-2',
        item: 'p-2 text-sm gap-2',
        itemLeadingIcon: 'size-5',
        itemLeadingAvatarSize: '2xs',
        itemLeadingChip: 'size-5',
        itemLeadingChipSize: 'md',
        itemTrailingIcon: 'size-5',
        empty: 'p-3 text-sm'
      },
      xl: {
        base: 'px-3 py-2 text-base gap-2',
        leading: 'ps-3',
        trailing: 'pe-3',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-6',
        label: 'p-2 text-sm gap-2',
        item: 'p-2 text-base gap-2',
        itemLeadingIcon: 'size-6',
        itemLeadingAvatarSize: 'xs',
        itemLeadingChip: 'size-6',
        itemLeadingChipSize: 'lg',
        itemTrailingIcon: 'size-6',
        empty: 'p-3 text-base'
      }
    },
    variant: {
      outline:
        'text-highlighted bg-default ring ring-inset ring-accented hover:bg-elevated disabled:bg-default',
      soft: 'text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50',
      subtle:
        'text-highlighted bg-elevated ring ring-inset ring-accented hover:bg-accented/75 disabled:bg-elevated',
      ghost:
        'text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent',
      none: 'text-highlighted bg-transparent focus:outline-none'
    },
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    leading: { true: '' },
    trailing: { true: '' },
    loading: { true: '' },
    highlight: { true: '' },
    fixed: { false: '' },
    type: {
      file: 'file:me-1.5 file:font-medium file:text-muted file:outline-none'
    },
    position: {
      popper: {
        content:
          'data-[state=open]:animate-[scale-in_100ms_var(--ease-out)] data-[state=closed]:animate-[scale-out_100ms_var(--ease-out)]'
      },
      'item-aligned': { content: '' }
    },
    multiple: { true: '' }
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: ['outline', 'subtle'],
      class:
        'outline-primary/25 focus-visible:outline-3 focus-visible:ring-primary'
    },
    {
      color: 'secondary',
      variant: ['outline', 'subtle'],
      class:
        'outline-secondary/25 focus-visible:outline-3 focus-visible:ring-secondary'
    },
    {
      color: 'success',
      variant: ['outline', 'subtle'],
      class:
        'outline-success/25 focus-visible:outline-3 focus-visible:ring-success'
    },
    {
      color: 'info',
      variant: ['outline', 'subtle'],
      class: 'outline-info/25 focus-visible:outline-3 focus-visible:ring-info'
    },
    {
      color: 'warning',
      variant: ['outline', 'subtle'],
      class:
        'outline-warning/25 focus-visible:outline-3 focus-visible:ring-warning'
    },
    {
      color: 'error',
      variant: ['outline', 'subtle'],
      class: 'outline-error/25 focus-visible:outline-3 focus-visible:ring-error'
    },
    {
      color: 'primary',
      variant: ['soft', 'ghost'],
      class: 'outline-primary/25 focus-visible:outline-3'
    },
    {
      color: 'secondary',
      variant: ['soft', 'ghost'],
      class: 'outline-secondary/25 focus-visible:outline-3'
    },
    {
      color: 'success',
      variant: ['soft', 'ghost'],
      class: 'outline-success/25 focus-visible:outline-3'
    },
    {
      color: 'info',
      variant: ['soft', 'ghost'],
      class: 'outline-info/25 focus-visible:outline-3'
    },
    {
      color: 'warning',
      variant: ['soft', 'ghost'],
      class: 'outline-warning/25 focus-visible:outline-3'
    },
    {
      color: 'error',
      variant: ['soft', 'ghost'],
      class: 'outline-error/25 focus-visible:outline-3'
    },
    {
      color: 'primary',
      highlight: true,
      class: 'ring ring-inset ring-primary'
    },
    {
      color: 'secondary',
      highlight: true,
      class: 'ring ring-inset ring-secondary'
    },
    {
      color: 'success',
      highlight: true,
      class: 'ring ring-inset ring-success'
    },
    { color: 'info', highlight: true, class: 'ring ring-inset ring-info' },
    {
      color: 'warning',
      highlight: true,
      class: 'ring ring-inset ring-warning'
    },
    { color: 'error', highlight: true, class: 'ring ring-inset ring-error' },
    {
      color: 'neutral',
      variant: ['outline', 'subtle'],
      class:
        'outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
    },
    {
      color: 'neutral',
      variant: ['soft', 'ghost'],
      class: 'outline-inverted/25 focus-visible:outline-3'
    },
    {
      color: 'neutral',
      highlight: true,
      class: 'ring ring-inset ring-inverted'
    },
    { leading: true, size: 'xs', class: 'ps-7' },
    { leading: true, size: 'sm', class: 'ps-8' },
    { leading: true, size: 'md', class: 'ps-9' },
    { leading: true, size: 'lg', class: 'ps-10' },
    { leading: true, size: 'xl', class: 'ps-11' },
    { trailing: true, size: 'xs', class: 'pe-7' },
    { trailing: true, size: 'sm', class: 'pe-8' },
    { trailing: true, size: 'md', class: 'pe-9' },
    { trailing: true, size: 'lg', class: 'pe-10' },
    { trailing: true, size: 'xl', class: 'pe-11' },
    {
      loading: true,
      leading: true,
      class: { leadingIcon: 'animate-spin' }
    },
    {
      loading: true,
      leading: false,
      trailing: true,
      class: { trailingIcon: 'animate-spin' }
    },
    { fixed: false, size: 'xs', class: 'md:text-xs' },
    { fixed: false, size: 'sm', class: 'md:text-xs' },
    { fixed: false, size: 'md', class: 'md:text-sm' },
    { fixed: false, size: 'lg', class: 'md:text-sm' }
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary',
    variant: 'outline',
    position: 'popper'
  }
} satisfies SelectConfig;
