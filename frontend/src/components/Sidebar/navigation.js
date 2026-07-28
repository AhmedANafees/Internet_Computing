export const DEFAULT_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Course Registration', path: '/courses' },
  { label: 'Timetable', path: '/timetable' },
];

export const ADMIN_NAV_ITEMS = [
  { label: 'Course List', path: '/admin/courses' },
  { label: 'Timetable', path: '/timetable' },
];

export function resolveNavItems(navItems, role) {
  if (Array.isArray(navItems) && navItems.length > 0) {
    return navItems;
  }

  return role === 'admin' ? ADMIN_NAV_ITEMS : DEFAULT_NAV_ITEMS;
}
