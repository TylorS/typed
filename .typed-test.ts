import { Options } from '@typed/test'

const nodeOptions: Options = {
  typeCheck: false,
  files: ['packages/**/*.test.ts'],
}

const browserOptions: Options = {
  ...nodeOptions,
  mode: 'browser',
  files: ['packages/**/*.browser-test.ts'],
}

const configs = [nodeOptions]

if (process.env.BROWSER) {
  configs.push(browserOptions)
}

export default configs
