import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageLanguage } from '@/hooks/use-page-language';
import { catalogText, content } from '@/lib/store-content';
import { listCatalog } from '@/lib/catalog.functions';

const catalogQuery = queryOptions({ queryKey: ['catalog'], queryFn: () => listCatalog() });

export const Route = createFileRoute('/catalog')({
  head: () => ({ meta: [
    { title: 'Каталог — Квадратний метр' },
    { name: 'description', content: 'Перевірені товари магазину «Квадратний метр» у Бобринці.' },
    { property: 'og:title', content: 'Каталог — Квадратний метр' },
    { property: 'og:description', content: 'Перевірені товари, ціни й наявність — лише після підтвердження магазином.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: CatalogPage,
});

function CatalogPage() {
  const { language, switchLanguage } = usePageLanguage(true);
  const t = content[language];
  const c = catalogText[language];
  const { data } = useSuspenseQuery(catalogQuery);
  return <main className="privacy-page wrap">
    <div className="privacy-toolbar"><Button variant="outline" asChild><Link to="/"><ArrowLeft />{t.back}</Link></Button><div className="language-switch"><Button variant="ghost" aria-pressed={language === 'uk'} onClick={() => switchLanguage('uk')}>UA</Button><span aria-hidden="true">|</span><Button variant="ghost" aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}>EN</Button></div></div>
    <p className="eyebrow">{t.brand}</p><h1>{c.title}</h1><p>{c.intro}</p>
    {data.error ? <p role="alert">{c.error}</p> : data.products.length === 0
      ? <section><p>{c.empty}</p><Button asChild><Link to="/" hash="contacts">{c.ask}<ArrowUpRight /></Link></Button></section>
      : <ul className="catalog-list">{data.products.map(p => <li key={p.sku ?? p.name} className="catalog-item">
          <h2>{language === 'en' && p.name_en ? p.name_en : p.name}</h2>
          <p className="text-sm text-muted-foreground">{[p.category, p.brand].filter(Boolean).join(' · ')}</p>
          <p><strong>{p.price.status === 'confirmed' ? `${p.price.price.toFixed(2)} ${p.price.currency} / ${p.unit}` : c.priceUnknown}</strong></p>
          <p className="text-sm">{c.stock[p.availability as keyof typeof c.stock] ?? c.stock.unknown}</p>
        </li>)}</ul>}
  </main>;
}
