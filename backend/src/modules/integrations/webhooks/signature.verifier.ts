// Webhook Signature Verification Abstraction
import * as crypto from 'crypto';

export interface SignatureVerifier {
  verify(rawBody: string, signature: string, secret: string): boolean;
}

export class HmacSha256SignatureVerifier implements SignatureVerifier {
  verify(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret || !rawBody) return false;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const sigBuffer = Buffer.from(signature.trim().toLowerCase());
      const expectedBuffer = Buffer.from(expectedSignature.toLowerCase());

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}

export class TokenSignatureVerifier implements SignatureVerifier {
  verify(_rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    return signature === secret;
  }
}

/**
 * Utility to generate signed payloads for test suites without external providers.
 */
export function generateSandboxSignature(rawBody: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
}
