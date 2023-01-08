import { existsSync } from 'fs'
import { basename, dirname, join, resolve } from 'path'

import {
  setupTsProject,
  makeBrowserModule,
  makeHtmlModule,
  makeRenderModule,
  readDirectory,
  readModules,
} from '@typed/compiler'
import glob from 'fast-glob'
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
   * Server file path
   */
  readonly server?: string
}

const cwd = process.cwd()

const PLUGIN_NAME = '@typed/vite-plugin'

const RENDER_VIRTUAL_ENTRYPOINT_PREFIX = 'typed:runtime'
const BROWSER_VIRTUAL_ENTRYPOINT_PREFIX = 'typed:browser'
const HTML_VIRTUAL_ENTRYPOINT_PREFIX = 'typed:html'

const VIRTUAL_ID_PREFIX = '\0'

export default function makePlugin({ directory, tsConfig, server }: PluginOptions): Plugin {
  const sourceDirectory = resolve(cwd, directory)
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig)
  const serverOutputDirectory = join(sourceDirectory, 'dist', 'server')
  const clientOutputDirectory = join(sourceDirectory, 'dist', 'client')

  console.info(`[${PLUGIN_NAME}]: Setting up typescript project...`)
  const project = setupTsProject(tsConfigFilePath)
  console.info(`[${PLUGIN_NAME}]: Finding HTML files...`)

  const htmlFilePaths = findHtmlFiles(sourceDirectory)

  if (htmlFilePaths.length === 0) {
    throw new Error(`[${PLUGIN_NAME}]: Could not find html files in ${sourceDirectory}`)
  }

  const serverFilePath = resolve(sourceDirectory, server ?? 'server.ts')
  const serverExists = existsSync(serverFilePath)
  const virtualIds = new Set<string>()

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

      if (!(config as any).buildSteps) {
        ;(config as any).buildSteps = [
          {
            name: 'client',
            config: {
              build: {
                outDir: clientOutputDirectory,
                rollupOptions: {
                  input: buildClientInput(htmlFilePaths),
                },
              },
            },
          },
          ...(serverExists
            ? [
                {
                  name: 'server',
                  config: {
                    build: {
                      ssr: true,
                      outDir: serverOutputDirectory,
                      rollupOptions: { input: serverFilePath },
                    },
                  },
                },
              ]
            : []),
        ]
      }
    },

    async resolveId(id, importer) {
      if (id.startsWith(RENDER_VIRTUAL_ENTRYPOINT_PREFIX)) {
        const virtualId =
          VIRTUAL_ID_PREFIX + `${importer}?modules=${parseModulesFromId(id, importer)}`

        virtualIds.add(virtualId)

        return virtualId
      }

      if (id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)) {
        const virtualId =
          VIRTUAL_ID_PREFIX + `${importer}?modules=${parseModulesFromId(id, importer)}&browser`

        virtualIds.add(virtualId)

        return virtualId
      }

      if (id.startsWith(HTML_VIRTUAL_ENTRYPOINT_PREFIX)) {
        const virtualId =
          VIRTUAL_ID_PREFIX +
          `${importer}?html=${basename(parseModulesFromId(id, importer), '.html')}`

        virtualIds.add(virtualId)

        return virtualId
      }

      // Virtual modules have problems with resolving modules due to not having a real directory to work with
      // thus the need to resolve them manually.
      if (
        importer?.startsWith(VIRTUAL_ID_PREFIX) &&
        (importer.includes('?modules=') || importer.includes('?html='))
      ) {
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

    async load(id) {
      if (virtualIds.has(id)) {
        const sourceFile = await buildVirtualModule(
          project,
          id,
          serverOutputDirectory,
          clientOutputDirectory,
        )
        const output = ts.transpileModule(sourceFile.getFullText(), {
          compilerOptions: project.getCompilerOptions(),
        })

        return {
          code: output.outputText,
          map: output.sourceMapText,
        }
      }
    },
  }
}

async function buildVirtualModule(
  project: Project,
  id: string,
  serverOutputDirectory: string,
  clientOutputDirectory: string,
) {
  const [importer, query] = id.split(VIRTUAL_ID_PREFIX)[1].split('?')

  if (query.includes('modules=')) {
    const moduleDirectory = resolve(dirname(importer), query.split('modules=')[1].split('&')[0])
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readModules(project, directory)

    if (query.includes('&browser')) {
      return makeBrowserModule(project, moduleTree, importer)
    }

    return makeRenderModule(project, moduleTree, importer)
  }

  const htmlFile = query.split('html=')[1]

  return makeHtmlModule(
    project,
    htmlFile + '.html',
    importer,
    serverOutputDirectory,
    clientOutputDirectory,
  )
}

function parseModulesFromId(id: string, importer: string | undefined) {
  const pages = id
    .replace(RENDER_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(HTML_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')

  if (pages === '') {
    throw new Error(`[${PLUGIN_NAME}]: No pages were specified from ${importer}`)
  }

  return pages
}

function findHtmlFiles(directory: string) {
  // eslint-disable-next-line import/no-named-as-default-member
  return glob.sync([
    join(directory, '**/*.html'),
    '!' + join(directory, '**/node_modules/**'),
    '!' + join(directory, '**/dist/**'),
  ])
}

function buildClientInput(htmlFilePaths: string[]) {
  const input: Record<string, string> = {}

  for (const htmlFilePath of htmlFilePaths) {
    const htmlFile = basename(htmlFilePath, '.html')

    input[htmlFile] = htmlFilePath
  }

  return input
}
