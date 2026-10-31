// Browser-safe catalog rules shared by the server retrieval layer, the catalog page and tests.

/** Shared product select used by every catalog query (server function and webhook). */
export const CATALOG_SELECT = 'id, sku, name_uk, name_en, brand, unit, specifications, is_active, is_demo, category:categories(name_uk, name_en), prices:product_prices(price, currency, valid_from, valid_until, is_demo), inventory:product_inventory(availability_status, updated_at, source)';

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
    category: product.category?.name_uk ?? null, unit: product.unit, specifications: Object.fromEntries(Object.entries(product.specifications ?? {}).map(([k, v]) => [k, String(v)])) as Record<string, string>,
    price: resolvePrice(product.prices, now), availability: resolveAvailability(product.inventory, now),
  };
}

// ---- Assistant lookup: internal catalog, including demo/inactive rows, with demo prices labelled as indicative ----

export type AssistantPrice =
  | { status: 'verified'; price: number; currency: string }
  | { status: 'indicative'; price: number; currency: string; note: string }
  | { status: 'missing' | 'conflict' };

const INDICATIVE_NOTE = 'Indicative catalog price (demo); the actual store price may differ. Орієнтовна ціна з каталогу, фактична ціна в магазині може відрізнятися.';

/** Verified prices win; otherwise a current demo price is returned flagged as indicative. Never invents a value. */
export function resolveAssistantPrice(prices: PriceRecord[], now = new Date()): AssistantPrice {
  const real = resolvePrice(prices, now);
  if (real.status === 'confirmed') return { status: 'verified', price: real.price, currency: real.currency };
  if (real.status === 'conflict') return { status: 'conflict' };
  const demo = prices.filter(p => p.is_demo && new Date(p.valid_from) <= now && (!p.valid_until || new Date(p.valid_until) > now));
  if (!demo.length) return { status: 'missing' };
  const p = [...demo].sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0]!;
  return { status: 'indicative', price: Number(p.price), currency: p.currency, note: INDICATIVE_NOTE };
}

const STOPWORDS = new Set(['потрібен', 'потрібна', 'потрібно', 'треба', 'яка', 'який', 'яке', 'ціна', 'ціну', 'скільки', 'коштує', 'вартість', 'є', 'чи', 'мені', 'для', 'на', 'та', 'і', 'й', 'price', 'how', 'much', 'need', 'the', 'for', 'is', 'cost', 'what', 'нужен', 'сколько', 'цена', 'стоит']);
const UNIT_UK: Record<string, string> = { pair: 'пара', liter: 'л', roll: 'рулон', bag: 'мішок', m3: 'м³', pack: 'упаковка', set: 'комплект', kg: 'кг', m2: 'м²', can: 'банка', piece: 'шт' };

const flat = (s: string) => s.toLowerCase().replace(/[-–—]/g, '');

export function assistantTerms(query: string): string[] {
  return query.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).map(w => w.replace(/-/g, ''))
    .filter(w => w && !STOPWORDS.has(w) && (w.length > 1 || /\d/.test(w))).slice(0, 10).map(w => SYNONYMS[w] ?? w);
}

/** Share of query terms found in name, brand, sku, category, unit and specification values. */
export function assistantScore(product: CatalogProduct, terms: string[]): number {
  if (!terms.length) return 0;
  const hay = flat([product.name_uk, product.name_en, product.brand, product.sku, product.category?.name_uk, product.category?.name_en,
    product.unit, UNIT_UK[product.unit], ...Object.values(product.specifications ?? {}).map(String)].filter(Boolean).join(' '));
  const hit = terms.filter(t => hay.includes(t.length > 4 && !/\d/.test(t) ? t.slice(0, -1) : t)).length;
  return hit / terms.length;
}

export function searchForAssistant(products: CatalogProduct[], query: string, now = new Date()) {
  const terms = assistantTerms(query);
  const scored = products.map(p => ({ p, s: assistantScore(p, terms) })).filter(x => x.s >= 0.5).sort((a, b) => b.s - a.s);
  return {
    total: scored.length,
    results: scored.slice(0, 5).map(({ p }) => ({
      name: p.name_uk, name_en: p.name_en, sku: p.sku, brand: p.brand, category: p.category?.name_uk ?? null,
      unit: p.unit, unit_uk: UNIT_UK[p.unit] ?? p.unit,
      specifications: Object.fromEntries(Object.entries(p.specifications ?? {}).map(([k, v]) => [k, String(v)])) as Record<string, string>,
      price: resolveAssistantPrice(p.prices, now),
      availability: resolveAvailability(p.inventory, now),
      availability_note: resolveAvailability(p.inventory, now) === 'unknown' ? 'Availability unknown — do not claim it is in stock; ask the customer to check with the store.' : null,
    })),
  };
}

/** Removes internal stage markers such as "[тепло]" or "[перевіряючи]" from text shown to customers. */
export function cleanAgentText(text: string): string {
  return text.replace(/\[[^\]\n]{1,40}\]/g, '').replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
}
