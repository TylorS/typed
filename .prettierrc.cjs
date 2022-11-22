module.exports = {
  printWidth: 100,
  bracketSpacing: true,
  jsxBracketSameLine: false,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  overrides: [
    {
      files: ['*.mts', '*.cts', '*.ts'],
      options: {
        parser: 'typescript'
      }
    }
  ]
}
