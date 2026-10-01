import fs from 'fs';
import path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isDemoEnvironment } from '@/lib/utils/security';

// Password hashes keyed by lower-cased identifier. Supabase `user_credentials` when the service
// role key is configured; otherwise (local demo, or table not migrated yet) .data/passwords.json.

const DATA_DIR = path.join(process.cwd(), '.data');
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.json');

const DEMO_SEED_PASSWORDS: Record<string, string> = {
  'superadmin': 'admin123',
  'admin': 'admin123',
  'usr-super-01': 'admin123',
  'admin@delhipublic.edu.in': 'admin123',
  'jdps-103': 'student123',
  'jdps-101': 'student123',
};

declare global {
  // eslint-disable-next-line no-var
  var __SERVER_PASSWORDS__: Record<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __CREDENTIALS_TABLE_MISSING__: boolean | undefined;
}

function credentialsClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (isDemoEnvironment() || !url || !serviceKey || globalThis.__CREDENTIALS_TABLE_MISSING__) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /could not find the table/i.test(error.message || '');
}

function markTableMissing(error: unknown) {
  if (!globalThis.__CREDENTIALS_TABLE_MISSING__) {
    console.error('Credentials: user_credentials table missing; falling back to .data/passwords.json (lost on redeploy). Run supabase/migrations/20261002000000_user_credentials.sql.', error);
  }
  globalThis.__CREDENTIALS_TABLE_MISSING__ = true;
}

function fileStore(): Record<string, string> {
  if (!globalThis.__SERVER_PASSWORDS__) {
    let fromFile: Record<string, string> = {};
    try {
      if (fs.existsSync(PASSWORDS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(PASSWORDS_FILE, 'utf-8'));
        if (parsed && typeof parsed === 'object') fromFile = parsed;
      }
    } catch (err) {
      console.error('Credentials: could not read passwords.json', err);
    }
    globalThis.__SERVER_PASSWORDS__ = { ...(isDemoEnvironment() ? DEMO_SEED_PASSWORDS : {}), ...fromFile };
  }
  return globalThis.__SERVER_PASSWORDS__;
}

function saveFileStore(store: Record<string, string>) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Credentials: could not write passwords.json', err);
  }
}

export async function readCredential(identifier: string): Promise<string | undefined> {
  const key = identifier.trim().toLowerCase();
  if (!key) return undefined;
  const client = credentialsClient();
  if (client) {
    const { data, error } = await client.from('user_credentials').select('secret_hash').eq('identifier', key).maybeSingle();
    if (!error) {
      if (data?.secret_hash) return data.secret_hash;
      // Not in the table yet: a hash may still sit in the legacy file from before the migration.
      return fileStore()[key];
    }
    if (!isMissingTable(error)) throw new Error(`Credentials read failed: ${error.message}`);
    markTableMissing(error);
  }
  return fileStore()[key];
}

export async function writeCredentials(identifiers: string[], secretHash: string): Promise<void> {
  const keys = [...new Set(identifiers.map((id) => id.trim().toLowerCase()).filter(Boolean))];
  if (keys.length === 0) return;
  const client = credentialsClient();
  if (client) {
    const now = new Date().toISOString();
    const { error } = await client
      .from('user_credentials')
      .upsert(keys.map((identifier) => ({ identifier, secret_hash: secretHash, updated_at: now })));
    if (!error) return;
    if (!isMissingTable(error)) throw new Error(`Credentials write failed: ${error.message}`);
    markTableMissing(error);
  }
  const store = fileStore();
  for (const key of keys) store[key] = secretHash;
  saveFileStore(store);
}
