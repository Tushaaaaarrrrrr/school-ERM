// Used only when SUPER_ADMIN_EMAILS is unset, so the platform owner keeps access after deploy.
const DEFAULT_SUPER_ADMIN_EMAILS = ['pay.laxmikant@gmail.com'];

export function getSuperAdminEmails(): string[] {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_SUPER_ADMIN_EMAILS;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}
