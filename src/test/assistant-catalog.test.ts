import { describe, expect, it } from 'vitest';
import { cleanAgentText, resolveAssistantPrice, searchForAssistant, type CatalogProduct } from '@/lib/catalog';

const now = new Date('2026-10-30T12:00:00Z');
const mk = (name: string, pack: string, price: number): CatalogProduct => ({
  id: name + pack, sku: null, name_uk: `${name} — ${pack}`, name_en: null, brand: null, unit: 'bag', is_active: false, is_demo: true,
  specifications: { variant: 'М-400', product_type: 'Цемент', size_or_packaging: pack }, category: null,
  prices: [{ price, currency: 'UAH', valid_from: '2026-01-01', valid_until: null, is_demo: true }], inventory: [],
});

describe('assistant catalog lookup', () => {
  const items = [mk('Цемент М-400', '50 кг', 410.26), mk('Цемент М-400', '25 кг', 266.11)];
  it('finds cement M400 25 kg from a natural question, including inactive demo rows', () => {
    const r = searchForAssistant(items, 'Потрібен цемент М400 25 кг, яка ціна?', now);
    expect(r.results[0]!.name).toBe('Цемент М-400 — 25 кг');
    expect(r.results[0]!.unit_uk).toBe('мішок');
  });
  it('returns demo prices flagged as indicative', () => {
    expect(resolveAssistantPrice(items[1]!.prices, now)).toMatchObject({ status: 'indicative', price: 266.11, currency: 'UAH' });
  });
  it('prefers verified prices over demo ones', () => {
    expect(resolveAssistantPrice([...items[1]!.prices, { price: 250, currency: 'UAH', valid_from: '2026-02-01', valid_until: null, is_demo: false }], now))
      .toEqual({ status: 'verified', price: 250, currency: 'UAH' });
  });
  it('never invents a price', () => expect(resolveAssistantPrice([], now).status).toBe('missing'));
  it('reports unknown availability without stock claims', () => expect(searchForAssistant(items, 'цемент 25 кг', now).results[0]!.availability).toBe('unknown'));
  it('strips internal markers', () => expect(cleanAgentText('[тепло] Цемент М400 — 266 грн. [перевіряючи]')).toBe('Цемент М400 — 266 грн.'));
});
