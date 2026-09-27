'use client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/auth-context';

export default function AccessUnavailablePage() {
  const { logout } = useAuth();
  return <main className="min-h-screen bg-slate-50 grid place-items-center p-6"><section className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
    <h1 className="text-xl font-bold text-slate-900">Account access unavailable</h1>
    <p className="text-sm text-slate-600">We could not grant access to a school. Your account may be disabled or revoked, or the access service may be temporarily unavailable.</p>
    <div className="flex justify-center gap-3"><Button onClick={() => window.location.reload()}>Retry</Button><Button variant="outline" onClick={logout}>Logout</Button></div>
  </section></main>;
}
