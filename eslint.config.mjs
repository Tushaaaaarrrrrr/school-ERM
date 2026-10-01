import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'mobile/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals'),
  { rules: { 'react/no-unescaped-entities': 'warn' } },
];

export default eslintConfig;
