module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: false,
    sourceType: 'module',
  },
  env: {
    es2022: true,
    node: true,
    browser: true,
    jest: true,
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['**/dist/**', '**/.next/**', '**/generated/**', 'node_modules/**'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
