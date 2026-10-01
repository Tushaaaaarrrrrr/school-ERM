import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Exercise production rules (no demo passwords, no demo fallbacks); nothing is contacted.
    env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key' },
  },
});
