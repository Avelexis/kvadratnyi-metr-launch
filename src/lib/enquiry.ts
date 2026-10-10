import { validPhone } from './store-content';
export type Enquiry = { name: string; phone: string; product: string; quantity: string; message: string; consent: boolean };
export function validateEnquiry(value: Enquiry): 'required' | 'phoneError' | 'consentError' | null {
  if (!value.name.trim() || !value.phone.trim() || !value.product.trim()) return 'required';
  if (!validPhone(value.phone)) return 'phoneError';
  if (!value.consent) return 'consentError';
  return null;
}