export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || '/teacher';
  const allowedPrefixes = ['/teacher', '/admin', '/staff', '/student', '/parent', '/super-admin', '/account'];
  const isAllowed = path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && allowedPrefixes.some(p => path === p || path.startsWith(`${p}/`));
  if (!isAllowed) return new Response('Invalid portal path', { status: 400 });
  // Keep web authentication and PIN checks; only discard a different user's cache.
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><script>
    try {
      const raw = document.cookie.split('; ').find(row => row.startsWith('school_erp_session='));
      const user = raw ? JSON.parse(decodeURIComponent(raw.slice(raw.indexOf('=') + 1))) : null;
      const saved = JSON.parse(localStorage.getItem('school_erp_active_user') || 'null');
      if (saved && saved.id !== user?.id) { localStorage.clear(); sessionStorage.clear(); }
    } catch { localStorage.clear(); sessionStorage.clear(); }
    location.replace(${JSON.stringify(path)});
  </script>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
