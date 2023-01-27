import { deepStrictEqual, ok } from 'assert'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { isSome, some } from '@fp-ts/core/Option'
import { describe, it } from 'vitest'

import { resolveTypedConfig } from './resolveTypedConfig.js'
import type { ResolvedOptions } from './vite-plugin.js'

const vitePluginSrcDirectory = dirname(fileURLToPath(import.meta.url))
const rootDirectory = dirname(dirname(dirname(vitePluginSrcDirectory)))
const sourceDirectory = join(rootDirectory, 'example')

describe(import.meta.url, () => {
  it(
    'resolves typed config',
    async () => {
      const config = await resolveTypedConfig({}, 'build', 'production')
      const expected: ResolvedOptions = {
        sourceDirectory,
        tsConfig: join(sourceDirectory, 'tsconfig.json'),
        serverFilePath: some(join(sourceDirectory, 'server.ts')),
        clientOutputDirectory: join(sourceDirectory, 'dist/client'),
        serverOutputDirectory: join(sourceDirectory, 'dist/server'),
        htmlFiles: [join(sourceDirectory, 'index.html'), join(sourceDirectory, 'other.html')],
        debug: false,
        saveGeneratedModules: true,
        isStaticBuild: false,
        base: '/',
      }

      ok(isSome(config))
      deepStrictEqual(config.value, expected)
    },
    {
      timeout: 10_000,
    },
  )
})
