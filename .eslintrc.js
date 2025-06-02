// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'prettier', // Make sure this is last to override other formatting rules
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jest', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error', // Report Prettier violations as ESLint errors
    'react/prop-types': 'off', // Not needed for TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ JSX transform
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Can be useful but sometimes too verbose
    '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for 'any'
    // Add any other custom rules here
  },
  overrides: [
    {
      // Disable some rules specifically for test files
      files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off', // Often have unused vars in tests
        '@typescript-eslint/no-empty-function': 'off', // Mock functions are often empty
      },
    },
  ],
};
