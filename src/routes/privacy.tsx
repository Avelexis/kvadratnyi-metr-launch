import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageLanguage } from '@/hooks/use-page-language';
import { content, store } from '@/lib/store-content';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [
    { title: 'Політика конфіденційності — Квадратний метр' },
    { name: 'description', content: 'Дані форми, вибір мови та зовнішні сервіси сайту «Квадратний метр».' },
    { property: 'og:title', content: 'Політика конфіденційності — Квадратний метр' },
    { property: 'og:description', content: 'Інформація про поточний стан обробки даних на сайті магазину.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: PrivacyPage,
});
function PrivacyPage() {
  const { language, switchLanguage } = usePageLanguage(true);
  const t = content[language];
  return <main className="privacy-page wrap">
    <div className="privacy-toolbar"><Button variant="outline" asChild><Link to="/"><ArrowLeft />{t.back}</Link></Button><div className="language-switch"><Button variant="ghost" aria-pressed={language === 'uk'} onClick={() => switchLanguage('uk')}>UA</Button><span>|</span><Button variant="ghost" aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}>EN</Button></div></div>
    <p className="eyebrow">{t.brand}</p><h1>{t.privacyTitle}</h1>
    {t.privacySections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}
    <Button asChild><a href={store.instagram} target="_blank" rel="noopener noreferrer"><Instagram />Instagram</a></Button>
  </main>;
}