import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, Menu, X, MapPin, Mic, Instagram, Layers, Wrench, LocateFixed, MessagesSquare, Quote, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreAssistant } from '@/components/store-assistant';
import { usePageLanguage } from '@/hooks/use-page-language';
import { validateEnquiry } from '@/lib/enquiry';
import { content, store } from '@/lib/store-content';
import hero from '@/assets/construction-hero.webp';
import building from '@/assets/building.webp';
import mixes from '@/assets/mixes.webp';
import tools from '@/assets/tools.webp';
import finishing from '@/assets/finishing.webp';
import plumbing from '@/assets/plumbing.webp';
import roofing from '@/assets/roofing.webp';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Квадратний метр — будівельні матеріали у Бобринці' },
    { name: 'description', content: 'Квадратний метр у Бобринці: матеріали для будівництва та ремонту. Уточніть асортимент і ціни. Вул. Каштанова, 74-А.' },
    { property: 'og:title', content: 'Квадратний метр — ваш магазин у Бобринці' },
    { property: 'og:description', content: 'Матеріали для ваших проєктів. Завітайте на вул. Каштанову, 74-А, або напишіть у Instagram.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
const ids = ['home', 'categories', 'advantages', 'contacts'];
const images = [building, mixes, tools, finishing, plumbing, roofing];
const benefitIcons = [Layers, Wrench, LocateFixed, MessagesSquare];
function Index() {
  const { language, switchLanguage } = usePageLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [consent, setConsent] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [formResult, setFormResult] = useState<'required' | 'phoneError' | 'consentError' | 'formError' | null>(null);
  const t = content[language];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id); }, { rootMargin: '-15% 0px -55% 0px' });
    for (const id of ids) { const el = document.getElementById(id); if (el) observer.observe(el); }
    const contactObserver = new IntersectionObserver(entries => setContactVisible(entries.some(entry => entry.isIntersecting)));
    const contactSection = document.getElementById('contacts');
    if (contactSection) contactObserver.observe(contactSection);
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); contactObserver.disconnect(); };
  }, []);
  function inquiry(category?: string) {
    if (category) setProduct(category);
    document.getElementById('contacts')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    setFormResult(null);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const error = validateEnquiry({ name, phone, product, quantity, message, consent });
    if (error) { setFormResult(error); return; }
    setFormResult('formError');
  }
  return <>
    <a href="#main-content" className="skip-link">{language === 'uk' ? 'Перейти до вмісту' : 'Skip to content'}</a>
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <a href="#home" className="brand" aria-label={t.brand}><span className="brand-mark" aria-hidden="true">м<span>²</span></span><span className="min-w-0"><strong>{t.brand}</strong><small>{t.subtitle}</small></span></a>
        <nav className="desktop-nav" aria-label={language === 'uk' ? 'Головна навігація' : 'Main navigation'}>{t.nav.map((label, i) => <a key={ids[i]} href={`#${ids[i]}`} aria-current={active === ids[i] ? 'location' : undefined} className={active === ids[i] ? 'active' : ''}>{label}</a>)}</nav>
        <div className="header-actions"><div className="language-switch" aria-label={language === 'uk' ? 'Мова' : 'Language'}><Button variant="ghost" aria-pressed={language === 'uk'} onClick={() => switchLanguage('uk')}>UA</Button><span aria-hidden="true">|</span><Button variant="ghost" aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}>EN</Button></div><Button asChild className="header-contact"><a href="#contacts">{t.contact}<ArrowUpRight /></a></Button><Button variant="ghost" size="icon" className="mobile-menu-button" aria-label={menuOpen ? t.close : t.menu} aria-expanded={menuOpen} aria-controls={menuOpen ? "mobile-navigation" : undefined} onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button></div>
      </div>
      {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label={language === 'uk' ? 'Мобільна навігація' : 'Mobile navigation'}>{t.nav.map((label, i) => <a key={ids[i]} href={`#${ids[i]}`} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={18} /></a>)}<Button className="mobile-quote" onClick={() => { setMenuOpen(false); inquiry(); }}>{t.contact}<ArrowUpRight /></Button></nav>}
    </header>
    <main id="main-content">
      <section className="hero" id="home">
        <img className="hero-image" src={hero} alt="" width={1920} height={1024} fetchPriority="high" />
        <div className="hero-shade" />
        <div className="hero-inner wrap"><div className="hero-panel">
          <span className="location-pill"><MapPin size={14} />{t.location}</span>
          <h1>{language === 'uk' ? <>КВАДРАТНИЙ<br /><span>МЕТР</span><span className="hero-square" aria-hidden="true">м²</span></> : <>KVADRATNYI<br /><span>METR</span><span className="hero-square" aria-hidden="true">m²</span></>}</h1>
          <h2>{t.heroLead}</h2><p>{t.heroText}</p>
          <div className="hero-buttons"><Button asChild><a href="#categories">{t.browse}<ArrowUpRight /></a></Button><Button variant="outline" onClick={() => inquiry()}>{t.contact}<ArrowUpRight /></Button></div>
        </div></div>
        <div className="hero-bottom wrap"><a href="#categories">{t.down}<ArrowDown size={16} /></a><span>{t.photoNote}</span></div>
      </section>
      <section className="category-section section" id="categories"><div className="wrap">
        <div className="section-heading"><div><p className="eyebrow">{t.categoryEyebrow}</p><h2>{t.categoryTitle}</h2></div><p className="section-intro">{t.categoryText}</p></div>
        <div className="category-grid">{t.categories.map(([title, description], i) => <article className="category-card" key={i}><div className="category-photo"><img src={images[i]} alt={title} loading="lazy" width={640} height={640} /><span className="category-index">0{i + 1}</span></div><div className="category-detail"><h3>{title}</h3><p>{description}</p><Button variant="ghost" className="category-link" onClick={() => inquiry(title)}>{t.inquire}<ArrowUpRight /></Button></div></article>)}</div>
        <p className="inventory-note"><Info size={15} />{t.categoryNote}</p>
      </div></section>
      <section className="about-section section" id="advantages"><div className="wrap about-layout"><div className="about-photo"><img src={hero} alt={language === 'uk' ? 'Ілюстрація матеріалів та інструментів для ремонту' : 'Illustrative renovation materials and tools'} width={1920} height={1024} loading="lazy" /><div className="about-photo-caption"><span className="brand-mark" aria-hidden="true">м<span>²</span></span><span>{t.brand}<small>{t.location}</small></span></div><span className="about-photo-note">{t.photoNote}</span></div><div className="about-copy"><p className="eyebrow">{t.aboutEyebrow}</p><h2>{t.aboutTitle}</h2><p className="about-text">{t.aboutText}</p><div className="benefits-grid">{t.benefits.map(([title, description], i) => { const Icon = benefitIcons[i] ?? Layers; return <div className="benefit" key={i}><Icon aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>; })}</div></div></div></section>
      <section className="gallery-section section"><div className="wrap"><div className="section-heading"><div><h2>{t.galleryTitle}</h2><p className="gallery-note">{t.galleryNote}</p></div></div><div className="gallery-grid">{[building, tools, finishing].map((src, i) => <figure key={src}><img src={src} width={640} height={640} loading="lazy" alt={`${t.categories[[0, 2, 3][i] ?? 0]?.[0]} — ${t.photoNote}`} /><figcaption>{t.categories[[0, 2, 3][i] ?? 0]?.[0]}</figcaption></figure>)}</div></div></section>
      <section className="review-section section" id="reviews"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">{t.reviewEyebrow}</p><h2>{t.reviewTitle}</h2></div><p className="section-intro">{t.reviewText}</p></div><div className="review-empty"><span className="review-symbol"><Quote aria-hidden="true" /></span><div><h3>{t.reviewEmpty}</h3><p>{t.reviewNote}</p></div><Button asChild variant="outline"><a href={store.instagram} target="_blank" rel="noopener noreferrer">{t.reviewCta}<ArrowUpRight /></a></Button></div></div></section>
      <section className="price-section"><div className="wrap price-layout"><div><p className="eyebrow">{t.priceEyebrow}</p><h2>{t.priceTitle}</h2><p>{t.priceText}</p></div><div className="price-actions"><Button onClick={() => inquiry()}>{t.priceCta}<ArrowUpRight /></Button><Button variant="outline" onClick={() => setAssistantOpen(true)}><Mic />{t.ask}</Button></div><span className="price-mark" aria-hidden="true">м²</span></div></section>
      <section className="contact-section section" id="contacts"><div className="wrap"><p className="eyebrow">{t.contactEyebrow}</p><h2>{t.contactTitle}</h2><div className="contact-layout"><div className="contact-details"><div className="contact-row"><span className="contact-icon"><MapPin /></span><div><p className="contact-label">{t.addressLabel}</p><h3>{t.address}</h3><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener noreferrer">{t.directions}<ArrowUpRight size={16} /></a><p className="text-xs text-muted-foreground mt-2">{t.directionsNote}</p></div></div><div className="contact-row"><span className="contact-icon"><Instagram /></span><div><p className="contact-label">{t.socials}</p><a className="instagram-link" href={store.instagram} target="_blank" rel="noopener noreferrer">@kvadratnyi__metr<ArrowUpRight size={18} /></a><p className="text-sm text-muted-foreground mt-3">{t.facebook}</p></div></div><p className="contact-missing"><Info size={16} />{t.hours}</p><div className="location-block"><LocateFixed size={28} /><span>{t.brand}<small>{t.location}</small></span><Button asChild variant="ghost" size="icon" aria-label={t.directions}><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener noreferrer"><ArrowUpRight /></a></Button></div></div>
      <form className="contact-form" onSubmit={submit} noValidate aria-describedby="enquiry-feedback"><h3>{t.formTitle}</h3><p>{t.formText}</p><div className="form-notice"><Info size={16} /><span>{t.formNotice}</span></div><div className="form-fields"><div><label htmlFor="contact-name">{t.name}</label><input id="contact-name" aria-invalid={formResult === "required" && !name.trim()} aria-describedby="enquiry-feedback" autoComplete="name" required placeholder={t.namePlaceholder} value={name} onChange={e => setName(e.target.value)} /></div><div><label htmlFor="contact-phone">{t.phone}</label><input id="contact-phone" aria-invalid={formResult === "phoneError" || (formResult === "required" && !phone.trim())} aria-describedby="enquiry-feedback" type="tel" autoComplete="tel" required placeholder={t.phonePlaceholder} value={phone} onChange={e => setPhone(e.target.value)} /></div></div><div className="form-fields enquiry-product-fields"><div><label htmlFor="contact-product">{t.product}</label><input id="contact-product" aria-invalid={formResult === "required" && !product.trim()} aria-describedby="enquiry-feedback" required placeholder={t.productPlaceholder} value={product} onChange={e => setProduct(e.target.value)} /></div><div><label htmlFor="contact-quantity">{t.quantity}</label><input id="contact-quantity" placeholder={t.quantityPlaceholder} value={quantity} onChange={e => setQuantity(e.target.value)} /></div></div><label htmlFor="contact-message">{t.comments}</label><textarea id="contact-message" rows={4} placeholder={t.messagePlaceholder} value={message} onChange={e => setMessage(e.target.value)} /><div className="consent-row"><input type="checkbox" id="contact-consent" aria-invalid={formResult === "consentError"} aria-describedby="enquiry-feedback" checked={consent} onChange={e => setConsent(e.target.checked)} aria-required="true" /><label htmlFor="contact-consent">{t.consent} <Link to="/privacy" target="_blank">{t.privacyTitle}</Link>.</label></div><p id="enquiry-feedback" className="form-feedback" role="status">{formResult ? t[formResult] : ''}</p><Button type="submit" className="w-full">{t.send}<ArrowRight /></Button><p className="privacy-note">{t.privacy}</p><Button asChild variant="outline" className="w-full mt-3"><a href={store.instagram} target="_blank" rel="noopener noreferrer"><Instagram />Instagram<ArrowUpRight /></a></Button></form></div></div></section>
    </main>
    <footer><div className="wrap footer-top"><a href="#home" className="brand" aria-label={t.brand}><span className="brand-mark" aria-hidden="true">м<span>²</span></span><span><strong>{t.brand}</strong><small>{t.footer}</small></span></a><nav aria-label={language === 'uk' ? 'Навігація внизу сторінки' : 'Footer navigation'}>{t.nav.map((label, i) => <a key={i} href={`#${ids[i]}`}>{label}</a>)}</nav><a href={store.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-instagram"><Instagram /></a></div><div className="wrap footer-bottom"><span>© 2026 {t.brand}. {t.rights}</span><span>{t.address.replace('\n', ' ')}</span><Link to="/privacy">{t.privacyTitle}</Link></div></footer>
    {!assistantOpen && !contactVisible && <Button className="floating-assistant" size="icon" aria-label={t.assistantLabel} onClick={() => setAssistantOpen(true)}><Mic /></Button>}
    <StoreAssistant open={assistantOpen} onOpenChange={setAssistantOpen} language={language} />
  </>;
}
