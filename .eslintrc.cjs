module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-case-declarations': 'off'
  },
  overrides: [
    {
      files: ['public/**/*.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly'
      }
    },
    {
      files: ['netlify/functions/**/*.js'],
      env: {
        node: true,
        browser: false
      }
    }
  ]
};