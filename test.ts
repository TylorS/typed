import { preview } from 'vite'

import { PLUGIN_NAME, type TypedVitePlugin } from './packages/vite-plugin/src/index.js'

const previewServer = await preview()

const { config, httpServer } = previewServer

const typedPlugin = config.plugins.find((x) => x.name === PLUGIN_NAME) as
  | TypedVitePlugin
  | undefined

if (!typedPlugin) {
  throw new Error(`Could not find ${PLUGIN_NAME}.`)
}

if (!httpServer) {
  throw new Error('Could not find httpServer.')
}
