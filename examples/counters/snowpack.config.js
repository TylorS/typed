/* eslint-disable no-undef */

const config = {
  alias: {
    '@typed/fp': '../../esm',
  },
  exclude: ['**/node/**/*', '**/*.test.ts'],
  mount: {
    src: '/',
    '../../esm': '/fp',
  },
  buildOptions: {
    sourceMaps: true,
  },
}

if (process.env.NODE_ENV === 'production') {
  config.plugins = [
    [
      '@snowpack/plugin-webpack',
      {
        manifest: true,
        outputPattern: {
          css: '[name].[contenthash].css',
          js: '[name].[contenthash].js',
          assets: '[name].[contenthash].[ext]',
        },
      },
    ],
  ]
}

module.exports = config
