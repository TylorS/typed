import { join } from 'path'

import typed from '@typed/vite-plugin'
import { mergeConfig, defineConfig } from 'vite'

import baseConfig from '../../vite.config.js'

export default defineConfig((config) => {
  return mergeConfig(baseConfig(config), {
    plugins: [
      typed({
        sourceDirectory: join(__dirname, 'src'),
        tsConfig: join(__dirname, 'tsconfig.json'),
      }),
    ],
  })
})
