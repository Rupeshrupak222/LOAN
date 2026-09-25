import { describe, it, expect } from 'vitest';
import { maskIdentifierValue } from './customer.service';

describe('Customer Consent & Identifier Foundation', () => {
  describe('maskIdentifierValue', () => {
    it('masks PAN with first 5 X and reveals last 4 characters', () => {
      const masked = maskIdentifierValue('PAN', 'ABCDE1234F');
      expect(masked).toBe('XXXXX1234F');
    });

    it('masks 12-digit Aadhaar as XXXX-XXXX-1234', () => {
      const masked = maskIdentifierValue('AADHAAR', '543210987654');
      expect(masked).toBe('XXXX-XXXX-7654');
    });

    it('masks other generic identifiers keeping last 4 digits', () => {
      const masked = maskIdentifierValue('PASSPORT', 'A1234567');
      expect(masked).toBe('XXXX4567');
    });
  });
});
