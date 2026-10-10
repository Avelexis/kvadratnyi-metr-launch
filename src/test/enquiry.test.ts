import { describe, expect, it } from 'vitest';
import { validateEnquiry, type Enquiry } from '@/lib/enquiry';
const enquiry: Enquiry = { name: 'Alex', phone: '+380501234567', product: 'Tools', quantity: '', message: '', consent: true };
describe('Price enquiry rules', () => {
  it('requires product or category', () => { expect(validateEnquiry({ ...enquiry, product: '' })).toBe('required'); });
  it('requires personal data consent', () => { expect(validateEnquiry({ ...enquiry, consent: false })).toBe('consentError'); });
  it('accepts optional quantity and comments omitted', () => { expect(validateEnquiry(enquiry)).toBe(null); });
  it('rejects an invalid phone', () => { expect(validateEnquiry({ ...enquiry, phone: '123' })).toBe('phoneError'); });
});