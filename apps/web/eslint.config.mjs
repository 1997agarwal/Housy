import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', 'node_modules/**', '.data/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // The domain layer deliberately validates untrusted JSON as `any` before narrowing it.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
