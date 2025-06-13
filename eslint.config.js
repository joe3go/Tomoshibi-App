import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
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
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      boundaries,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'pages',
              allow: ['components', 'hooks', 'lib', 'types'],
            },
            {
              from: 'components',
              allow: ['hooks', 'lib', 'types', 'ui'],
            },
            {
              from: 'hooks',
              allow: ['lib', 'types'],
            },
          ],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'boundaries/elements': [
        { type: 'pages', pattern: 'client/src/pages/*' },
        { type: 'components', pattern: 'client/src/components/*' },
        { type: 'hooks', pattern: 'client/src/hooks/*' },
        { type: 'lib', pattern: 'client/src/lib/*' },
        { type: 'types', pattern: 'client/src/types/*' },
        { type: 'ui', pattern: 'client/src/components/ui/*' },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
];