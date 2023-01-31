import { resolve } from 'path'

import * as Option from '@fp-ts/core/Option'
import { buildClientInput, resolveTypedConfig } from '@typed/vite-plugin'
import { preview as vitePreview, type InlineConfig } from 'vite'

import { attemptToFindViteConfig, cleanOptions } from './helpers.js'
import type { ServeEnv, ServeOptions } from './runDevServer.js'

export const runPreviewServer = async (options: ServeOptions, env: ServeEnv) => {
  const inlineConfig: InlineConfig = {
    base: options.base,
    mode: options.mode,
    configFile: options.config ?? attemptToFindViteConfig(env.cwd),
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
    optimizeDeps: { force: options.force },
    preview: cleanOptions(options),
  }

  const optionConfig = await resolveTypedConfig(inlineConfig, 'build')

  if (Option.isNone(optionConfig)) {
    throw new Error('Unable to resolve @typed/vite-plugin config')
  }

  const config = optionConfig.value

  // If we output our own server, lets run it
  if (Option.isSome(config.serverFilePath)) {
    // Run our server
    return await import(resolve(config.serverOutputDirectory, 'index.js'))
  }

  // Otherwise, lets run vite's preview server
  const previewServer = await vitePreview({
    ...inlineConfig,
    build: {
      rollupOptions: { input: buildClientInput(config.htmlFiles) },
      outDir: config.clientOutputDirectory,
    },
  })

  previewServer.printUrls()
}
