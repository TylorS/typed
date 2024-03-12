import { readFile } from "fs/promises"
import { join, relative, resolve } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { vavite } from "vavite"
import type { Plugin, PluginOption } from "vite"
import compression from "vite-plugin-compression"
import tsconfigPaths from "vite-tsconfig-paths"
import type { TypedOptions } from "./types.js"

export interface TypedPluginOptions {
  readonly clientEntry: string
  readonly clientOutputDirectory?: string

  readonly serverEntry: string
  readonly serverOutputDirectory?: string

  readonly rootDir?: string
  readonly tsconfig?: string
}

export function makeTypedPlugin(pluginOptions: TypedPluginOptions): Array<PluginOption> {
  const rootDir = pluginOptions.rootDir ? resolve(pluginOptions.rootDir) : process.cwd()
  const clientOutputDirectory = pluginOptions.clientOutputDirectory
    ? resolve(rootDir, pluginOptions.clientOutputDirectory)
    : resolve(rootDir, "dist/client")
  const serverOutputDirectory = pluginOptions.serverOutputDirectory
    ? resolve(rootDir, pluginOptions.serverOutputDirectory)
    : resolve(rootDir, "dist/server")
  const tsconfig = resolve(rootDir, pluginOptions.tsconfig ?? "tsconfig.json")
  const options: TypedOptions = {
    clientEntry: relative(rootDir, resolve(rootDir, pluginOptions.clientEntry)),
    serverEntry: relative(rootDir, resolve(rootDir, pluginOptions.serverEntry)),
    relativeServerToClientOutputDirectory: relative(serverOutputDirectory, clientOutputDirectory),
    assetDirectory: "assets"
  }

  const plugins: Array<PluginOption> = [
    {
      name: "vite-plugin-typed",
      config(config, env) {
        config.root = rootDir
        config.optimizeDeps = {
          ...config.optimizeDeps,
          exclude: Array.from(new Set([...(config.optimizeDeps?.exclude ?? []), "@typed/core"]))
        }

        if (config.build?.assetsDir) {
          Object.assign(options, {
            assetDirectory: relative(
              clientOutputDirectory,
              resolve(clientOutputDirectory, config.build.assetsDir)
            )
          })
        }

        if (env.mode === "multibuild") {
          ;(config as any).buildSteps = [
            {
              name: "client",
              config: {
                build: {
                  outDir: clientOutputDirectory,
                  manifest: true,
                  rollupOptions: { input: options.clientEntry }
                }
              }
            },
            {
              name: "server",
              config: {
                build: {
                  ssr: true,
                  outDir: serverOutputDirectory,
                  rollupOptions: { input: options.serverEntry }
                }
              }
            }
          ]
        }
      }
    },
    tsconfigPaths({ projects: [tsconfig] }),
    compression(),
    visualizer({
      gzipSize: true,
      filename: join(clientOutputDirectory, ".vite/dependency-visualizer.html"),
      title: "Dependency Visualizer"
    }),
    vavite({
      serverEntry: options.serverEntry,
      serveClientAssetsInDev: true
    }),
    exposeAssetManifest(join(clientOutputDirectory, ".vite/manifest.json")),
    exposeTypedOptions(options)
  ]

  return plugins
}

function exposeAssetManifest(path: string): Plugin {
  let isDev = false
  return {
    name: "expose-asset-manifest",
    config(_, env) {
      isDev = env.command === "serve"
    },
    resolveId(id) {
      if (id === "virtual:asset-manifest") {
        return id
      }
    },
    async load(id) {
      if (id === "virtual:asset-manifest") {
        if (isDev) return `export default {}`

        const content = JSON.parse(await readFile(path, "utf-8"))

        return `export default ${JSON.stringify(content, null, 2)}`
      }
    }
  }
}

function exposeTypedOptions(options: TypedOptions): Plugin {
  return {
    name: "expose-typed-options",
    resolveId(id) {
      if (id === "virtual:typed-options") {
        return id
      }
    },
    async load(id) {
      if (id === "virtual:typed-options") {
        return `export default ${JSON.stringify(options, null, 2)}`
      }
    }
  }
}
