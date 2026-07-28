import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_NAV_ITEMS, DEFAULT_NAV_ITEMS, resolveNavItems } from './navigation.js';

test('uses admin navigation when the stored role is admin', () => {
  assert.deepEqual(resolveNavItems([], 'admin'), ADMIN_NAV_ITEMS);
});

test('uses the provided navigation items when they are supplied', () => {
  const customItems = [{ label: 'Custom', path: '/custom' }];
  assert.deepEqual(resolveNavItems(customItems, 'student'), customItems);
});

test('falls back to the student navigation items otherwise', () => {
  assert.deepEqual(resolveNavItems([], 'student'), DEFAULT_NAV_ITEMS);
});
