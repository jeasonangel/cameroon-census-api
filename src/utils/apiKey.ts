import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '../config';

export function generateApiKey(): { raw: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const prefix = raw.slice(0, 12);
  return { raw, prefix };
}

export async function hashApiKey(raw: string): Promise<string> {
  return bcrypt.hash(raw, config.bcryptSaltRounds);
}

export async function compareApiKey(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}
