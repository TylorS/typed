import { mergeConfig, defineConfig } from 'vite'

import baseConfig from '../../vite.config.js'

export default defineConfig(async (config) => {
  return mergeConfig(await baseConfig(config), {
    plugins: [],
    test: {
      browser: {
        enabled: true,
        name: 'chrome', // browser name is required
      },
    },
  })
})
