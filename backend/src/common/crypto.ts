import crypto from 'crypto';
import { env } from '../config/env';

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV

/**
 * Derives a deterministic 32-byte encryption key from the environment secret.
 */
function getDerivedKey(customSecret?: string): Buffer {
  const masterSecret = customSecret || env.jwt.accessSecret || 'adyapan-default-secure-master-encryption-key-32b';
  return crypto.scryptSync(masterSecret, 'adyapan-salt-kdf-fixed', 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with authenticated tag.
 */
export function encryptSecret(plainText: string, customSecret?: string): EncryptedPayload {
  if (!plainText) {
    return { encrypted: '', iv: '', tag: '' };
  }

  const key = getDerivedKey(customSecret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext.
 */
export function decryptSecret(payload: EncryptedPayload, customSecret?: string): string {
  if (!payload.encrypted || !payload.iv || !payload.tag) {
    return '';
  }

  const key = getDerivedKey(customSecret);
  const iv = Buffer.from(payload.iv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));

  let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
