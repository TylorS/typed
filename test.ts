import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { identity, pipe } from '@fp-ts/data/Function'
import { createServer, type ViteDevServer } from 'vite'

import type { ModuleTreeJsonWithFallback } from './packages/compiler/src/index.js'
import type { IntrinsicServices } from './packages/framework/src/index.js'
import {
  type ClientManifest,
  PLUGIN_NAME,
  type TypedVitePlugin,
  type HtmlEntryFile,
} from './packages/vite-plugin/src/index.js'

const server: ViteDevServer = await createServer({ mode: 'production' }).then((s) => s.listen())

const typedPlugin = server.config.plugins.find((x) => x.name === PLUGIN_NAME) as TypedVitePlugin

if (!typedPlugin) {
  throw new Error('Typed vite plugin not found')
}

const { resolvedClientOutputDirectory, resolvedServerOutputDirectory } = typedPlugin

const clientManifest = JSON.parse(
  readFileSync(join(resolvedClientOutputDirectory, 'typed-manifest.json')).toString(),
) as ClientManifest

const entryFileToModuleTrees = new Map<HtmlEntryFile, ModuleTreeJsonWithFallback[]>()

// Retrieve all module trees from the client manifest
for (const htmlEntryFile of clientManifest.entryFiles) {
  for (const i of htmlEntryFile.imports) {
    const manifestEntries = clientManifest.modules[i]

    if (!manifestEntries) {
      continue
    }

    for (const key in manifestEntries) {
      const manifestEntry = manifestEntries[key]

      if (manifestEntry.type === 'runtime' || manifestEntry.type === 'browser') {
        if (entryFileToModuleTrees.get(htmlEntryFile)?.push(manifestEntry)) {
          continue
        }

        entryFileToModuleTrees.set(htmlEntryFile, [manifestEntry])
      }
    }
  }
}

const staticPaths = new Set<string>()

// Collect all static paths
for (const [htmlEntryFile, moduleTrees] of entryFileToModuleTrees) {
  for (const moduleTree of moduleTrees) {
    await collectStaticPaths(htmlEntryFile.basePath, moduleTree)
  }
}

// TODO: Construct a server from the module trees to do the rendering rather than needing an output server

// Start our server
await import(join(resolvedServerOutputDirectory, 'index.js'))

for (const path of staticPaths) {
  const assetsDir = join(resolvedClientOutputDirectory, 'assets')
  const outDir = join(assetsDir, path)
  const htmlFilePath = path === '/' ? join(assetsDir, 'index.html') : getHtmlFilePath(outDir)

  mkdirSync(dirname(htmlFilePath), { recursive: true })

  const html = await fetch('http://localhost:3000' + (path === '/' ? '' : path)).then((r) =>
    r.text(),
  )

  writeFileSync(htmlFilePath, html)
}

await server.close()

process.exit(0)

// Helpers

async function collectStaticPaths(
  basePath: string,
  moduleTree: ModuleTreeJsonWithFallback,
): Promise<void> {
  try {
    const environment = moduleTree.environment
      ? await loadModule(moduleTree.environment.sourceFile)
      : null
    const modules = await Promise.all(moduleTree.modules.map((m) => loadModule(m.sourceFile)))

    for (const mod of modules) {
      if (!mod) {
        continue
      }

      const paths = await getStaticPathsFromModule(
        mod,
        environment?.environment as Layer.Layer<IntrinsicServices, never, any>,
      )

      for (const path of paths) {
        staticPaths.add(join(basePath, path))
      }
    }

    await Promise.all(moduleTree.children.map((m) => collectStaticPaths(basePath, m)))
  } catch (e) {
    console.error(e)
  }
}

async function getStaticPathsFromModule(
  mod: Record<string, any>,
  environment?: Layer.Layer<IntrinsicServices, never, any>,
): Promise<string[]> {
  if (mod.getStaticPaths) {
    const effect = pipe(
      mod.getStaticPaths,
      mod.environment ? Effect.provideSomeLayer(mod.environment) : identity,
      environment ? Effect.provideSomeLayer(environment) : identity,
    )

    return await Effect.unsafeRunPromise(effect)
  }

  if (mod.route && !mod.route.path.includes(':')) {
    return [mod.route.path]
  }

  return []
}

async function loadModule(path: string) {
  try {
    return await server.ssrLoadModule(path)
  } catch (e) {
    console.error(`Failed to load module: ${path}`)
    console.error(e)

    return null
  }
}

function getHtmlFilePath(path: string) {
  if (path === '/') return 'index.html'
  if (path.endsWith('/')) return path.slice(0, -1) + '.html'

  return path + '.html'
}
