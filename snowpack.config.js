/* eslint-disable no-undef */

const config = {
  alias: {
    '@typed/fp': './src'
  },
  exclude: ['**/node/**/*', '**/*.browser-test.ts', '**/*.test.ts', '**/tsconfig.*.json'],
  mount: {
    src: '/',
  },
  buildOptions: {
    sourceMaps: true,
  },
}

module.exports = config
