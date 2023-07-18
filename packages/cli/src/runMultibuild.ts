import { existsSync } from 'fs'
import { resolve } from 'path'

import * as Option from '@effect/data/Option'
import { resolveTypedConfig } from '@typed/vite-plugin'
import multibuild from '@vavite/multibuild'
import colors from 'picocolors'
import type { LogLevel, ResolvedConfig } from 'vite'

import type { ViteCliOptions } from './ViteCliOptions.js'
import { attemptToFindViteConfig, cleanOptions } from './helpers.js'
import { runViteNode, type ViteNodeServerOptionsCLI } from './runViteNode.js'

export interface MultibuildOptions extends ViteCliOptions {
  c?: boolean | string
  base?: string
  l?: LogLevel
  logLevel?: LogLevel
  clearScreen?: boolean
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  s?: string
  static?: string
  options?: ViteNodeServerOptionsCLI
}

export interface MultibuildEnv {
  readonly cwd: string
  readonly outputHelp: () => void
}

export async function runMultibuild(options: MultibuildOptions, env: MultibuildEnv) {
  const optionConfig = await resolveTypedConfig(
    {
      base: options.base,
      configFile: options.config || attemptToFindViteConfig(env.cwd),
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
    },
    'build',
  )

  if (Option.isNone(optionConfig)) {
    throw new Error('Unable to resolve @typed/vite-plugin config')
  }

  const config = optionConfig.value
  const root = resolve(env.cwd, config.sourceDirectory)

  process.env.NODE_ENV = options.mode || 'production'

  let initialConfig: ResolvedConfig

  await multibuild(
    {
      root,
      base: options.base,
      configFile: options.config ?? attemptToFindViteConfig(root),
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      build: cleanOptions(options),
    },
    {
      onInitialConfigResolved(config: ResolvedConfig) {
        initialConfig = config
      },

      onStartBuildStep(info: any) {
        if (!info.currentStep) return

        initialConfig.logger.info(
          (info.currentStepIndex ? '\n' : '') +
            colors.cyan('vavite: ') +
            colors.white('running build step') +
            ' ' +
            colors.blue(info.currentStep.name) +
            ' (' +
            colors.green(info.currentStepIndex + 1 + '/' + info.buildSteps.length) +
            ')',
        )
      },
    },
  )

  if (options.static) {
    let staticPath = resolve(root, options.static)

    // Attempt to resolve state bath both from resolve root and cwd
    if (!existsSync(staticPath)) {
      staticPath = resolve(env.cwd, options.static)
    }

    await runViteNode(
      [staticPath],
      {
        root,
        config: options.config,
        options: options.options,
        static: true,
      },
      env,
    )
  }
}
