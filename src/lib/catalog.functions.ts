import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { CATALOG_SELECT, searchForAssistant, toAnswer, type CatalogProduct } from '@/lib/catalog';

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
      h.set('apikey', key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

const SELECT = CATALOG_SELECT;

// Assistant lookup over the internal catalog (includes inactive/demo rows by request). Read-only; demo prices are returned flagged as indicative.
export const searchCatalog = createServerFn({ method: 'POST' })
  .inputValidator((input: { query: string }) => ({ query: String(input?.query ?? '').slice(0, 120) }))
  .handler(async ({ data }) => {
    if (!data.query.trim()) return { results: [], total: 0 };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: rows, error } = await supabaseAdmin.from('products').select(SELECT).limit(5000);
    if (error) { console.error('Catalog search failed', error.message); return { results: [], total: 0, error: 'unavailable' }; }
    return searchForAssistant(rows as unknown as CatalogProduct[], data.query);
  });

export const listCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { data: rows, error } = await publicClient().from('products').select(SELECT).order('name_uk').limit(500);
  if (error) { console.error('Catalog list failed', error.message); return { products: [], error: 'unavailable' as const }; }
  return { products: (rows as unknown as CatalogProduct[]).map(p => toAnswer(p)), error: null };
});
