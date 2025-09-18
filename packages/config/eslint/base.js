module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Basic rules only - TypeScript rules commented out until we fix the config
    // '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // '@typescript-eslint/no-explicit-any': 'warn',
    // '@typescript-eslint/explicit-function-return-type': 'off',
    // '@typescript-eslint/explicit-module-boundary-types': 'off',
    // '@typescript-eslint/no-empty-function': 'off',
    // '@typescript-eslint/prefer-const': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Import rules
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    
    // Formatting (handled by Prettier, but these don't conflict)
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'coverage/',
    'node_modules/',
    '*.generated.*',
  ],
};