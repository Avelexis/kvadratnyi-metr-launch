import { describe, expect, it } from 'vitest';
import { getSavedLanguage, languageStorageKey, store } from '@/lib/store-content';
describe('Approved store requirements', () => {
  it('defaults to Ukrainian', () => { expect(getSavedLanguage(null)).toBe('uk'); });
  it('restores English from the language preference', () => { localStorage.setItem(languageStorageKey, 'en'); expect(getSavedLanguage(localStorage.getItem(languageStorageKey))).toBe('en'); });
  it('does not claim the contact form is connected', () => { expect(store.formConnected).toBe(false); });
  it('marks the ElevenLabs voice assistant as connected', () => { expect(store.voiceConnected).toBe(true); });
  it('uses the supplied store address', () => { expect(store.address).toBe('вул. Каштанова, 74-А, Бобринець, Україна'); });
  it('uses the supplied Instagram profile', () => { expect(store.instagram).toBe('https://www.instagram.com/kvadratnyi__metr/'); });
});