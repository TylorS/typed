import { existsSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { basename, dirname, join, relative, resolve } from 'path'

import {
  setupTsProject,
  makeBrowserModule,
  makeHtmlModule,
  makeRuntimeModule,
  readDirectory,
  readModules,
} from '@typed/compiler'
import glob from 'fast-glob'
import { Project, ts } from 'ts-morph'
// @ts-expect-error Unable to resolve types w/ NodeNext
import vavite from 'vavite'
import { ConfigEnv, PluginOption, UserConfig, ViteDevServer } from 'vite'
import compression from 'vite-plugin-compression'
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

const RENDER_VIRTUAL_ENTRYPOINT_PREFIX = 'runtime'
const BROWSER_VIRTUAL_ENTRYPOINT_PREFIX = 'browser'
const HTML_VIRTUAL_ENTRYPOINT_PREFIX = 'html'

const VIRTUAL_ID_PREFIX = '\0'

export default function makePlugin({ directory, tsConfig, server }: PluginOptions): PluginOption[] {
  const sourceDirectory = resolve(cwd, directory)
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig)
  const serverOutputDirectory = join(sourceDirectory, 'dist', 'server')
  const clientOutputDirectory = join(sourceDirectory, 'dist', 'client')
  const serverFilePath = resolve(sourceDirectory, server ?? 'server.ts')
  const serverExists = existsSync(serverFilePath)
  const virtualIds = new Set<string>()

  const plugins: PluginOption[] = [
    tsconfigPaths({
      projects: [join(sourceDirectory, 'tsconfig.json')],
    }),
  ]

  const setupProject = () => {
    console.info(`[${PLUGIN_NAME}]: Setting up typescript project...`)
    const project = setupTsProject(tsConfigFilePath)

    return project
  }

  let production = false
  let devServer: ViteDevServer
  let project: Project

  const virtualModulePlugin: PluginOption = {
    name: PLUGIN_NAME,

    config(config: UserConfig, env: ConfigEnv) {
      if (env.command === 'build') {
        production = true

        if (!config.plugins) {
          config.plugins = []
        }

        config.plugins.push(
          ...(serverExists
            ? [
                vavite({
                  serverEntry: serverFilePath,
                  serveClientAssetsInDev: true,
                }),
              ]
            : []),
        )
      }

      // Configure Build steps when running with vavite
      if (env.mode === 'multibuild') {
        const clientBuild: UserConfig['build'] = {
          outDir: clientOutputDirectory,
          rollupOptions: {
            input: buildClientInput(findHtmlFiles(sourceDirectory)),
          },
        }

        const serverBuild: UserConfig['build'] = {
          ssr: true,
          outDir: serverOutputDirectory,
          rollupOptions: {
            input: serverFilePath,
          },
        }

        ;(config as any).buildSteps = [
          {
            name: 'client',
            // @ts-expect-error Unable to resolve types w/ NodeNext
            config: { build: clientBuild, plugins: [compression()] },
          },
          ...(serverExists
            ? [
                {
                  name: 'server',
                  config: { build: serverBuild },
                },
              ]
            : []),
        ]

        return
      }
    },

    configureServer(server) {
      if (!devServer) {
        devServer = server
      }
    },

    async buildEnd() {
      if (production && devServer) {
        await devServer.close()
      }
    },

    async resolveId(id: string, importer?: string) {
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
          VIRTUAL_ID_PREFIX + `${importer}?source=${parseModulesFromId(id, importer)}`

        virtualIds.add(virtualId)

        return virtualId
      }

      // Virtual modules have problems with resolving modules due to not having a real directory to work with
      // thus the need to resolve them manually.
      if (importer?.startsWith(VIRTUAL_ID_PREFIX)) {
        // If a relative path, attempt to match to a source .ts(x) file
        if (id.startsWith('.')) {
          const dir = getVirtualSourceDirectory(importer)
          const tsPath = resolve(dir, id.replace(/.js(x)?$/, '.ts$1'))

          if (existsSync(tsPath)) {
            return tsPath
          }

          const jsPath = resolve(dir, id)

          if (existsSync(jsPath)) {
            return tsPath
          }
        }
      }
    },

    async load(id: string) {
      if (virtualIds.has(id)) {
        if (!project) {
          project = setupProject()
        }

        const sourceFile = await buildVirtualModule(
          project,
          id,
          sourceDirectory,
          serverOutputDirectory,
          clientOutputDirectory,
          devServer,
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

  plugins.push(virtualModulePlugin)

  return plugins
}

async function buildVirtualModule(
  project: Project,
  id: string,
  sourceDirectory: string,
  serverOutputDirectory: string,
  clientOutputDirectory: string,
  devServer?: ViteDevServer,
) {
  const [importer, query] = id.split(VIRTUAL_ID_PREFIX)[1].split('?')

  // If the query is for a render module, read the directory and transform it into a module.
  if (query.includes('modules=')) {
    const moduleDirectory = resolve(dirname(importer), query.split('modules=')[1].split('&')[0])
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readModules(project, directory)

    if (query.includes('&browser')) {
      return makeBrowserModule(project, moduleTree, importer)
    }

    return makeRuntimeModule(project, moduleTree, importer)
  }

  // If the query is for an HTML file, read the file and transform it into a module.

  const htmlFile = query.split('source=')[1]
  const htmlFilePath = resolve(dirname(importer), htmlFile + '.html')
  let html = readFileSync(htmlFilePath, 'utf-8').toString()

  // If there's a dev server, use it to transform the HTML for development
  if (devServer) {
    html = await devServer.transformIndexHtml(getRelativePath(sourceDirectory, htmlFilePath), html)
  } else {
    // Otherwise, read the already transformed file from the output directory.
    html = (
      await readFile(
        resolve(clientOutputDirectory, relative(sourceDirectory, htmlFilePath)),
        'utf-8',
      )
    ).toString()
  }

  return await makeHtmlModule({
    project,
    filePath: htmlFilePath,
    html,
    importer,
    serverOutputDirectory,
    clientOutputDirectory,
    devServer,
  })
}

function getVirtualSourceDirectory(id: string) {
  return dirname(id.split(VIRTUAL_ID_PREFIX)[1].split('?')[0])
}

function parseModulesFromId(id: string, importer: string | undefined): string {
  const pages = id
    .replace(RENDER_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(HTML_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')

  if (pages === '') {
    throw new Error(`[${PLUGIN_NAME}]: No pages were specified from ${importer}`)
  }

  return pages
}

function findHtmlFiles(directory: string): readonly string[] {
  // eslint-disable-next-line import/no-named-as-default-member
  return glob.sync([
    join(directory, '**/*.html'),
    '!' + join(directory, '**/node_modules/**'),
    '!' + join(directory, '**/dist/**'),
  ])
}

function buildClientInput(htmlFilePaths: readonly string[]) {
  const input: Record<string, string> = {}

  for (const htmlFilePath of htmlFilePaths) {
    const htmlFile = basename(htmlFilePath, '.html')

    input[htmlFile] = htmlFilePath
  }

  return input
}

function getRelativePath(from: string, to: string) {
  const path = relative(from, to)

  if (!path.startsWith('.')) {
    return './' + path
  }

  return path
}
