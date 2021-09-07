const prettierConfig = require('./.prettierrc.cjs')

module.exports = {
  extends: ['standard-with-typescript', 'prettier'],
  plugins: ['prettier', 'simple-import-sort'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'prettier/prettier': ['error', prettierConfig],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'import/no-cycle': ['error', { maxDepth: Infinity }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    'no-void': 'off',
  },
  settings: {
    'import/resolver': {
      'custom-alias': {
        alias: {
          '@/': './src',
        },
        extensions: ['.ts', '.tsx'],
      },
    },
  },
}
