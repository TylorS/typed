import { Options } from '@typed/test'

const browserOptions: Options = {
  mode: 'browser',
  browser: 'chrome-headless',
  files: ['source/**/*.test.ts', 'source/**/*.browser-test.ts'],
}

export default browserOptions
