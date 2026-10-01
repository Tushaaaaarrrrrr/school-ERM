-- Server-side password store (scrypt hashes). Replaces .data/passwords.json, which lived on
-- Render's ephemeral disk and was wiped on every deploy/restart.
-- Keys are lower-cased identifiers (email, login id / registration number, or persona id).
CREATE TABLE IF NOT EXISTS public.user_credentials (
  identifier TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL CHECK (secret_hash LIKE 'scrypt$%'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS on with no policies: only the service role (which bypasses RLS) can read or write.
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_credentials FROM anon, authenticated;
