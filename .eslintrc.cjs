module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'prettier' // Must be last
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Add your custom rules here
    'no-unused-vars': ['error', {
      varsIgnorePattern: '^(React|Box|Text)$',
      argsIgnorePattern: '^_'
    }]
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.min.js'
  ]
};
