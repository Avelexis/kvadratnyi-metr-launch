// Browser-safe catalog rules shared by the server retrieval layer, the catalog page and tests.

export type PriceRecord = { price: number; currency: string; valid_from: string; valid_until: string | null; is_demo?: boolean };
export type InventoryRecord = { availability_status: string; updated_at: string; source: string | null };
export type CatalogProduct = {
  id: string; sku: string | null; name_uk: string; name_en: string | null; brand: string | null; unit: string;
  specifications: Record<string, unknown>; is_active: boolean; is_demo?: boolean;
  category: { name_uk: string; name_en: string } | null;
  prices: PriceRecord[]; inventory: InventoryRecord[];
};

export type PriceResult =
  | { status: 'confirmed'; price: number; currency: string }
  | { status: 'missing' | 'expired' | 'conflict' };

/** Deterministic: only valid, non-demo prices count; more than one distinct current value is a conflict for admin review. */
export function resolvePrice(prices: PriceRecord[], now = new Date()): PriceResult {
  const real = prices.filter(p => !p.is_demo);
  if (!real.length) return { status: 'missing' };
  const current = real.filter(p => new Date(p.valid_from) <= now && (!p.valid_until || new Date(p.valid_until) > now));
  if (!current.length) return { status: 'expired' };
  const distinct = new Set(current.map(p => `${Number(p.price).toFixed(2)} ${p.currency}`));
  if (distinct.size > 1) return { status: 'conflict' };
  const p = current[0]!;
  return { status: 'confirmed', price: Number(p.price), currency: p.currency };
}

const STOCK_MAX_AGE_DAYS = 7;
/** Stock is reported only from a recent record with a named source; otherwise it is "unknown". */
export function resolveAvailability(inventory: InventoryRecord[], now = new Date()): string {
  const latest = [...inventory].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  if (!latest || !latest.source || latest.source === 'demo') return 'unknown';
  const age = (now.getTime() - new Date(latest.updated_at).getTime()) / 86_400_000;
  return age <= STOCK_MAX_AGE_DAYS ? latest.availability_status : 'unknown';
}

const SYNONYMS: Record<string, string> = {
  cement: 'цемент', 'цементу': 'цемент', 'цемента': 'цемент', plaster: 'штукатурка', putty: 'шпаклівка', 'шпаклевка': 'шпаклівка',
  primer: 'грунтовка', 'ґрунтовка': 'грунтовка', paint: 'фарба', 'краска': 'фарба', tile: 'плитка', adhesive: 'клей', glue: 'клей',
  drywall: 'гіпсокартон', 'гипсокартон': 'гіпсокартон', 'гкл': 'гіпсокартон', insulation: 'утеплювач', 'утеплитель': 'утеплювач',
  brick: 'цегла', 'кирпич': 'цегла', sand: 'пісок', 'песок': 'пісок', pipe: 'труба', roofing: 'покрівля', screw: 'саморіз', 'саморез': 'саморіз',
};

export function normalizeQuery(query: string): string[] {
  return query.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(w => w.length > 1).slice(0, 8)
    .map(w => SYNONYMS[w] ?? w);
}

export function matches(product: CatalogProduct, terms: string[]): boolean {
  if (!product.is_active || product.is_demo) return false;
  const hay = [product.name_uk, product.name_en, product.brand, product.sku, product.category?.name_uk, product.category?.name_en]
    .filter(Boolean).join(' ').toLowerCase();
  return terms.length > 0 && terms.every(t => hay.includes(t.length > 4 ? t.slice(0, -1) : t));
}

export function toAnswer(product: CatalogProduct, now = new Date()) {
  return {
    name: product.name_uk, name_en: product.name_en, sku: product.sku, brand: product.brand,
    category: product.category?.name_uk ?? null, unit: product.unit, specifications: product.specifications,
    price: resolvePrice(product.prices, now), availability: resolveAvailability(product.inventory, now),
  };
}
