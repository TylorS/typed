/* eslint-disable no-undef */

const config = {
  alias: {
    '@typed/fp': '../../src',
  },
  exclude: ['**/*.test.ts', '**/src/node/**/*'],
  mount: {
    src: '/',
    '../../src': '/typed-fp',
  },
  buildOptions: {
    sourceMaps: true,
  },
}

module.exports = config
