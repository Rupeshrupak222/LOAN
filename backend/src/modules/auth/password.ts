import argon2 from 'argon2';

/** Password hashing using Argon2id. */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  if (!hash || !plain) return false;

  // 1. Direct Argon2 Verification
  try {
    if (hash.startsWith('$argon2')) {
      const isValid = await argon2.verify(hash, plain);
      if (isValid) return true;
    }
  } catch {
    return false;
  }

  return false;
}
