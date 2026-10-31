// ElevenLabs Server Tool (webhook): the voice agent calls this endpoint directly
// to look up products, prices and availability in the store catalog.
// Public prefix bypasses site auth, so the handler verifies a shared secret header.
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { CATALOG_SELECT, searchForAssistant, type CatalogProduct } from '@/lib/catalog';

const bodySchema = z.object({ query: z.string().min(1).max(120) });

/** Constant-time comparison so the shared secret cannot be probed by timing. */
function secretsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute('/api/public/search-catalog')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['CATALOG_TOOL_SECRET'];
        if (!secret) {
          console.error('Catalog tool called but CATALOG_TOOL_SECRET is not configured');
          return Response.json({ success: false, error: 'not_configured' }, { status: 500 });
        }
        const provided = request.headers.get('x-catalog-secret') ?? '';
        if (!provided || !secretsEqual(provided, secret)) {
          return Response.json({ success: false, error: 'unauthorized' }, { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ success: false, error: 'invalid_json' }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { success: false, error: 'invalid_request', details: 'Body must be JSON: { "query": string (1-120 chars) }' },
            { status: 400 },
          );
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: rows, error } = await supabaseAdmin.from('products').select(CATALOG_SELECT).limit(5000);
        if (error) {
          console.error('Catalog tool query failed', error.message);
          return Response.json({ success: false, error: 'unavailable' }, { status: 502 });
        }

        const { results, total } = searchForAssistant(rows as unknown as CatalogProduct[], parsed.data.query);
        return Response.json({
          success: true,
          total,
          products: results.map((r) => ({
            name: r.name,
            name_en: r.name_en,
            sku: r.sku,
            brand: r.brand,
            category: r.category,
            price: r.price.status === 'verified' || r.price.status === 'indicative' ? r.price.price : null,
            currency: r.price.status === 'verified' || r.price.status === 'indicative' ? r.price.currency : null,
            unit: r.unit_uk,
            price_type: r.price.status,
            price_note: r.price.status === 'indicative' ? r.price.note : null,
            availability: r.availability,
            availability_note: r.availability_note,
          })),
        });
      },
    },
  },
});
