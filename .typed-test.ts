import { Options } from '@typed/test'

const browserOptions: Options = {
  mode: 'browser',
  browser: 'chrome-headless',
  files: ['src/**/*.test.ts', 'src/**/*.browser-test.ts'],
}

export default browserOptions
