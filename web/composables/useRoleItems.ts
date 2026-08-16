// * The two roles as `v-select` items, localized. Domain data rather than layout: a third role is added here, not in each form that offers the choice.
export function useRoleItems() {
  const { t } = useI18n();

  return computed(() => [
    { title: t('users.roles.user'), value: 'user' },
    { title: t('users.roles.admin'), value: 'admin' }
  ]);
}
