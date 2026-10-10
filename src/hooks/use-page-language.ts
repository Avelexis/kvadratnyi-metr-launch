import { useEffect, useState } from 'react';
import { content, getSavedLanguage, languageStorageKey, type Language } from '@/lib/store-content';

export function usePageLanguage(privacy = false) {
  const [language, setLanguage] = useState<Language>('uk');
  useEffect(() => {
    try { setLanguage(getSavedLanguage(localStorage.getItem(languageStorageKey))); } catch { /* Optional browser preference. */ }
  }, []);
  useEffect(() => {
    const t = content[language];
    document.documentElement.lang = language;
    document.title = privacy ? `${t.privacyTitle} — ${t.brand}` : t.seoTitle;
    const description = privacy ? t.privacyDescription : t.seoDescription;
    for (const [selector, value] of [
      ['meta[name="description"]', description], ['meta[property="og:title"]', document.title],
      ['meta[property="og:description"]', description],
    ]) { for (const el of document.querySelectorAll(selector ?? '')) el.setAttribute('content', value ?? ''); }
    // No published/custom URL is configured. Keep preview domains out of canonical tags.
  }, [language, privacy]);
  function switchLanguage(value: Language) {
    setLanguage(value);
    try { localStorage.setItem(languageStorageKey, value); } catch { /* Switch still works. */ }
  }
  return { language, switchLanguage };
}