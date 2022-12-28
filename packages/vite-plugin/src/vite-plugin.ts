import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

/// <reference types="vavite/vite-config" />

import { setupTsProject, scanSourceFiles, buildEntryPoint } from '@typed/compiler'
import { Environment } from '@typed/html'
import { Project } from 'ts-morph'
// @ts-expect-error Types don't seem to work with ESNext module resolution
import { default as vavite } from 'vavite'
import { Plugin } from 'vite'
import compression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

export interface PluginOptions {
  readonly directory: string
  readonly tsConfig: string
  readonly pages: readonly string[]
}

const cwd = process.cwd()

const PLUGIN_NAME = '@typed/vite-plugin'
const BROWSER_VIRTUAL_ENTRYPOINT = 'virtual:browser-entry'
const SERVER_VIRTUAL_ENTRYPOINT = 'virtual:server-entry'

export default function makePlugin({ directory, tsConfig, pages }: PluginOptions): Plugin {
  const sourceDirectory = resolve(cwd, directory)
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig)

  console.info(`[${PLUGIN_NAME}]: Setting up typescript project...`)
  const project = setupTsProject(tsConfigFilePath)

  const BROWSER_VIRTUAL_ID = '\0' + join(sourceDirectory, 'browser.ts')
  const SERVER_VIRTUAL_ID = '\0' + join(sourceDirectory, 'server.ts')

  return {
    name: PLUGIN_NAME,
    config(config) {
      if (!config.plugins) {
        config.plugins = []
      }

      config.plugins.push(
        tsconfigPaths({
          projects: [tsConfigFilePath],
        }),
        vavite({
          serverEntry: join(sourceDirectory, 'server.ts'),
          serveClientAssetsInDev: true,
        }),
        // @ts-expect-error Types don't seem to work with ESNext module resolution
        compression(),
      )

      // Setup vavite multi-build

      if (!(config as any).buildSteps) {
        ;(config as any).buildSteps = [
          {
            name: 'client',
            config: {
              build: {
                outDir: 'dist/client',
                rollupOptions: { input: resolve(sourceDirectory, 'index.html') },
              },
            },
          },
          {
            name: 'server',
            config: {
              build: {
                ssr: true,
                outDir: 'dist/server',
                rollupOptions: { input: resolve(sourceDirectory, 'server.ts') },
              },
            },
          },
        ]
      }
    },

    async resolveId(id, importer) {
      if (id === BROWSER_VIRTUAL_ENTRYPOINT) {
        return BROWSER_VIRTUAL_ID
      }

      if (id === SERVER_VIRTUAL_ENTRYPOINT) {
        return SERVER_VIRTUAL_ID
      }

      if (importer === BROWSER_VIRTUAL_ID || importer === SERVER_VIRTUAL_ID) {
        // Re-route relative imports to source files
        if (id.startsWith('.')) {
          const resolved = resolve(sourceDirectory, id.replace(/\.js(x)?/, '.ts$1'))

          return resolved
        } else {
          // Should only be resolving a node module
          const dir = findNodeModule(sourceDirectory, id)
          const packageJson = JSON.parse(readFileSync(join(dir, 'package.json')).toString())

          return join(dir, packageJson.module || packageJson.main)
        }
      }
    },

    load(id) {
      if (id === BROWSER_VIRTUAL_ID) {
        return scanAndBuild(sourceDirectory, pages, project, 'browser')
      }

      if (id === SERVER_VIRTUAL_ID) {
        return scanAndBuild(sourceDirectory, pages, project, 'server')
      }
    },
  }
}

function scanAndBuild(
  dir: string,
  pages: readonly string[],
  project: Project,
  environment: Environment,
) {
  const scanned = scanSourceFiles(
    pages.map((x) => join(dir, x)),
    project,
  )
  const entryPoint = buildEntryPoint(scanned, project, environment, join(dir, `${environment}.ts`))

  const outputFiles = entryPoint.getEmitOutput().getOutputFiles()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const outputFile = outputFiles
    .find((f) => f.getFilePath().endsWith('.js') || f.getFilePath().endsWith('.jsx'))!
    .getText()

  return {
    code: outputFile,
  }
}

function findNodeModule(dir: string, id: string) {
  let potential = resolve(dir, 'node_modules', id)

  while (dir !== '/') {
    if (existsSync(potential)) {
      return potential
    }

    dir = dirname(dir)
    potential = resolve(dir, 'node_modules', id)
  }

  return id
}
