import { existsSync } from 'fs'
import { join, resolve } from 'path'

/// <reference types="vavite/vite-config" />

import { setupTsProject, scanSourceFiles, buildEntryPoint } from '@typed/compiler'
import { Environment } from '@typed/html'
import { Project, ts } from 'ts-morph'
// @ts-expect-error Types don't seem to work with ESNext module resolution
import { default as vavite } from 'vavite'
import { Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export interface PluginOptions {
  /**
   * The directory in which you have your entry files. Namely an index.html file and optionally a server.ts file
   */
  readonly directory: string
  /**
   * The name/path to your tsconfig.json file, relative to the directory above or absolute
   */
  readonly tsConfig: string
  /**
   * File globs to scan for pages, relative to the directory above or absolute
   */
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

  const indexHtmlFilePath = join(sourceDirectory, 'index.html')

  if (!existsSync(indexHtmlFilePath)) {
    throw new Error(`[${PLUGIN_NAME}]: Could not find index.html file at ${indexHtmlFilePath}`)
  }

  const serverFilePath = join(sourceDirectory, 'server.ts')
  const serverExists = existsSync(serverFilePath)

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
        ...(serverExists
          ? [
              vavite({
                serverEntry: serverFilePath,
                serveClientAssetsInDev: true,
              }),
            ]
          : []),
      )

      // Setup vavite multi-build

      if (serverExists && !(config as any).buildSteps) {
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
                rollupOptions: { input: serverFilePath },
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

      // Virtual modules have problems with resolving modules due to not having a real directory to work with
      // thus the need to resolve them manually.
      if (importer === BROWSER_VIRTUAL_ID || importer === SERVER_VIRTUAL_ID) {
        // If a relative path, attempt to match to a source .ts(x) file
        if (id.startsWith('.')) {
          const tsPath = resolve(sourceDirectory, id.replace(/.js(x)?$/, '.ts$1'))

          if (existsSync(tsPath)) {
            return tsPath
          }

          const jsPath = resolve(sourceDirectory, id)

          if (existsSync(jsPath)) {
            return tsPath
          }
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
  const filePath = join(dir, `${environment}.ts`)
  const entryPoint = buildEntryPoint(scanned, project, environment, filePath)
  const output = ts.transpileModule(entryPoint.getFullText(), { compilerOptions: project.getCompilerOptions() })

  return {
    code: output.outputText,
    map: output.sourceMapText,
  }
}
