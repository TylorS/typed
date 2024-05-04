/**
 * @since 1.0.0
 */

import { readFile } from "fs/promises"
import { join, relative, resolve } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { vavite } from "vavite"
import type { Plugin, PluginOption } from "vite"
import compression from "vite-plugin-compression"
import tsconfigPaths from "vite-tsconfig-paths"
import type { TypedOptions } from "./types.js"

/**
 * @since 1.0.0
 */
export interface TypedPluginOptions {
  readonly clientEntry: string
  readonly clientOutputDirectory?: string

  readonly serverEntry: string
  readonly serverOutputDirectory?: string

  readonly rootDir?: string
  readonly tsconfig?: string
}

/**
 * @since 1.0.0
 */
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
          exclude: Array.from(
            new Set([...(config.optimizeDeps?.exclude ?? []), "@typed/core/Node", "@typed/core/Platform"])
          )
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
                  rollupOptions: { input: options.clientEntry }
                },
                plugins: [
                  compression(),
                  visualizer({
                    gzipSize: true,
                    filename: join(clientOutputDirectory, ".vite/dependency-visualizer.html"),
                    title: "Dependency Visualizer"
                  })
                ]
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
    vavite({
      serverEntry: options.serverEntry,
      serveClientAssetsInDev: true
    }),
    exposeAssetManifest(clientOutputDirectory),
    exposeTypedOptions(options)
  ]

  return plugins
}

function exposeAssetManifest(clientOutputDirectory: string): Plugin {
  let isDev = true
  let isClient = false
  let path = join(clientOutputDirectory, ".vite/manifest.json")
  return {
    name: "expose-asset-manifest",
    config(config, env) {
      config.build ??= {}
      config.build.sourcemap = true

      if (!config.build.manifest) {
        config.build.manifest = true
      }

      isDev = env.command !== "build"

      if (!isDev) {
        Object.assign(config.build, { minify: true, cssMinify: true })
      }
    },
    configResolved(config) {
      if (typeof config.build.manifest === "string") {
        path = resolve(clientOutputDirectory, config.build.manifest)
      }

      if (config.build.outDir === clientOutputDirectory) {
        isClient = true
      }
    },
    resolveId(id) {
      if (id === "virtual:asset-manifest") {
        return id
      }
    },
    async load(id) {
      if (id === "virtual:asset-manifest") {
        if (isDev || isClient) {
          return `
        export default {}`
        }

        const content = JSON.parse(await readFile(path, "utf-8"))

        return `
        export default ${JSON.stringify(content, null, 2)}`
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
        const entries = Object.entries(options)
        const lines = entries.map(([key, value]) => `
        export const ${key} = "${value}"`)

        return lines.join("\n") + "\n"
      }
    }
  }
}
