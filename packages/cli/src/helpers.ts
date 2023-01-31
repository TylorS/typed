import { existsSync } from 'fs'
import { homedir } from 'os'
import { resolve, dirname } from 'path'

import type { ViteNodeServerOptions } from 'vite-node'

import type { MultibuildOptions } from './runMultibuild.js'
import type { ViteNodeServerOptionsCLI } from './runViteNode.js'

export function cleanOptions<Options extends MultibuildOptions>(
  options: Options,
): Omit<Options, keyof MultibuildOptions> {
  const ret = { ...options }
  delete ret['--']
  delete ret.c
  delete ret.config
  delete ret.base
  delete ret.l
  delete ret.logLevel
  delete ret.clearScreen
  delete ret.d
  delete ret.debug
  delete ret.f
  delete ret.filter
  delete ret.m
  delete ret.mode
  return ret
}

export function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1]
    }
  }
}

export function parseViteNodeServerOptions(
  serverOptions: ViteNodeServerOptionsCLI,
  staticBuild: boolean,
): ViteNodeServerOptions {
  const inlineOptions =
    serverOptions.deps?.inline === true ? true : toArray(serverOptions.deps?.inline)

  return {
    ...serverOptions,
    deps: {
      ...serverOptions.deps,
      inline:
        inlineOptions !== true
          ? inlineOptions.map((dep) => {
              return dep.startsWith('/') && dep.endsWith('/') ? new RegExp(dep) : dep
            })
          : true,
      external: toArray(serverOptions.deps?.external).map((dep) => {
        return dep.startsWith('/') && dep.endsWith('/') ? new RegExp(dep) : dep
      }),
    },

    transformMode: {
      ...serverOptions.transformMode,
      ssr: [
        ...(staticBuild ? [new RegExp('.svelte')] : []),
        ...toArray(serverOptions.transformMode?.ssr).map((dep) => new RegExp(dep)),
      ],
      web: toArray(serverOptions.transformMode?.web).map((dep) => new RegExp(dep)),
    },
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  return value ? (Array.isArray(value) ? value : [value]) : []
}

export function attemptToFindViteConfig(root: string): string | undefined {
  if (root === homedir()) {
    return undefined
  }

  const pathsToTry = ['vite.config.ts', 'vite.config.js', 'vite.config.cjs', 'vite.config.mjs']

  for (const path of pathsToTry) {
    const configPath = resolve(root, path)

    if (existsSync(configPath)) {
      return configPath
    }
  }

  return attemptToFindViteConfig(dirname(root))
}
