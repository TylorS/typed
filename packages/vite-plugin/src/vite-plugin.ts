import { join, resolve } from 'path'

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
const BROWSER_VIRTUAL_ID = '\0' + BROWSER_VIRTUAL_ENTRYPOINT
const SERVER_VIRTUAL_ID = '\0' + SERVER_VIRTUAL_ENTRYPOINT

const buildCommands = ['build', 'multibuild']

export default function makePlugin({ directory, tsConfig, pages }: PluginOptions): Plugin {
  const sourceDirectory = resolve(cwd, directory)

  // Allow virtual files with relative paths to resolve from source directory
  process.chdir(sourceDirectory)

  const tsConfigFilePath = resolve(sourceDirectory, tsConfig)

  console.info(`[${PLUGIN_NAME}]: Setting up typescript project...`)
  const project = setupTsProject(tsConfigFilePath)

  return {
    name: PLUGIN_NAME,
    config(config, env) {
      if (!config.plugins) {
        config.plugins = []
      }

      config.plugins.push(
        tsconfigPaths({
          projects: [tsConfigFilePath],
        }),
        // @ts-expect-error Types don't seem to work with ESNext module resolution
        compression(),
      )

      if (buildCommands.includes(env.command)) {
        config.plugins.push(
          vavite({
            serverEntry: join(sourceDirectory, 'server.ts'),
            serveClientAssetsInDev: true,
          }),
        )

        // Setup vavite multi-build
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
      } else {
        config.build = {
          outDir: 'dist/client',
          rollupOptions: { input: resolve(sourceDirectory, 'index.html') },
        }
      }
    },

    resolveId(id, importer) {
      if (id === BROWSER_VIRTUAL_ENTRYPOINT) {
        return BROWSER_VIRTUAL_ID
      }

      if (id === SERVER_VIRTUAL_ENTRYPOINT) {
        return SERVER_VIRTUAL_ID
      }

      // Re-route relative imports to source files
      if (
        (importer === BROWSER_VIRTUAL_ID || importer === SERVER_VIRTUAL_ID) &&
        id.startsWith('.')
      ) {
        return join(sourceDirectory, id.replace(/\.js(x)?/, '.ts$1'))
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
  const scanned = scanSourceFiles(pages, project)
  const entryPoint = buildEntryPoint(scanned, project, environment, join(dir, `${environment}.ts`))

  const outputFiles = entryPoint.getEmitOutput().getOutputFiles()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const outputFile = outputFiles
    .find((f) => f.getFilePath().endsWith('.js') || f.getFilePath().endsWith('.jsx'))!
    .getText()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sourceMap = outputFiles.find((f) => f.getFilePath().endsWith('.map'))!.getText()

  return {
    code: outputFile,
    map: JSON.parse(sourceMap),
  }
}
