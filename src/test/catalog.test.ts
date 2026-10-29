import { describe, expect, it } from 'vitest';
import { matches, normalizeQuery, resolveAvailability, resolvePrice, type CatalogProduct } from '@/lib/catalog';

const now = new Date('2026-10-29T12:00:00Z');
const base: CatalogProduct = {
  id: '1', sku: 'C-400', name_uk: 'Цемент М-400 — 25 кг', name_en: 'Cement M-400 25 kg', brand: null, unit: 'bag', specifications: {},
  is_active: true, is_demo: false, category: { name_uk: 'Цемент і в\'яжучі', name_en: 'Cement and binders' }, prices: [], inventory: [],
};

describe('catalog search', () => {
  it('finds exact product names', () => expect(matches(base, normalizeQuery('Цемент М-400'))).toBe(true));
  it('maps English and Russian synonyms to Ukrainian', () => {
    expect(matches(base, normalizeQuery('cement'))).toBe(true);
    expect(matches(base, normalizeQuery('цемента'))).toBe(true);
  });
  it('finds by category', () => expect(matches(base, normalizeQuery('binders'))).toBe(true));
  it('never returns inactive products', () => expect(matches({ ...base, is_active: false }, normalizeQuery('цемент'))).toBe(false));
  it('never returns demo products', () => expect(matches({ ...base, is_demo: true }, normalizeQuery('цемент'))).toBe(false));
});

describe('price resolution', () => {
  const p = (price: number, from: string, until: string | null = null, is_demo = false) => ({ price, currency: 'UAH', valid_from: from, valid_until: until, is_demo });
  it('reports a missing price', () => expect(resolvePrice([], now).status).toBe('missing'));
  it('ignores demo prices', () => expect(resolvePrice([p(266.11, '2026-01-01', null, true)], now).status).toBe('missing'));
  it('reports an expired price', () => expect(resolvePrice([p(100, '2026-01-01', '2026-06-01')], now).status).toBe('expired'));
  it('flags conflicting current prices', () => expect(resolvePrice([p(100, '2026-01-01'), p(120, '2026-02-01')], now).status).toBe('conflict'));
  it('confirms a single current price with currency', () => expect(resolvePrice([p(100, '2026-01-01', '2026-06-01'), p(120, '2026-06-01')], now)).toEqual({ status: 'confirmed', price: 120, currency: 'UAH' }));
});

describe('availability', () => {
  it('is unknown without a record', () => expect(resolveAvailability([], now)).toBe('unknown'));
  it('is unknown for stale records', () => expect(resolveAvailability([{ availability_status: 'in_stock', updated_at: '2026-09-01', source: 'pos' }], now)).toBe('unknown'));
  it('is reported for recent sourced records', () => expect(resolveAvailability([{ availability_status: 'in_stock', updated_at: '2026-10-28', source: 'pos' }], now)).toBe('in_stock'));
});
