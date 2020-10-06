import { Options } from '@typed/test'

const nodeOptions: Options = {
  files: ['src/**/*.test.ts'],
}

const browserOptions: Options = {
  mode: 'browser',
  browser: 'chrome-headless',
  files: ['src/**/*.test.ts', 'src/**/*.browser-test.ts'],
}

export default process.env.BROWSER ? [nodeOptions, browserOptions] : nodeOptions
