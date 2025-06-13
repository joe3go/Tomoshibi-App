
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      boundaries,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'boundaries/element-types': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'client/src/App.tsx' },
        { type: 'pages', pattern: 'client/src/pages/**' },
        { type: 'components', pattern: 'client/src/components/**' },
        { type: 'hooks', pattern: 'client/src/hooks/**' },
        { type: 'lib', pattern: 'client/src/lib/**' },
        { type: 'server', pattern: 'server/**' },
        { type: 'shared', pattern: 'shared/**' },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
  },
];
