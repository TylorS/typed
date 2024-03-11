import { dirname, join } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { fileURLToPath } from "url"
import { vavite } from "vavite"
import { defineConfig } from "vite"
import type { Plugin } from "vite"
import compression from "vite-plugin-compression"
import tsconfigPaths from "vite-tsconfig-paths"

const exclusions = ["core", "fx", "router", "template", "ui"].flatMap((pkg) => [
  `@typed/${pkg}`,
  `@typed/${pkg}/*`
])

const dir = dirname(fileURLToPath(import.meta.url))
const src = join(dir, "src")

export default defineConfig({
  optimizeDeps: {
    exclude: exclusions
  },
  buildSteps: [
    {
      name: "client",
      config: {
        build: {
          outDir: "dist/client",
          manifest: true,
          rollupOptions: { input: join(src, "client.ts") }
        }
      }
    },
    {
      name: "server",
      config: {
        build: {
          ssr: true,
          outDir: "dist/server",
          rollupOptions: { input: join(src, "server.ts") }
        }
      }
    }
  ],
  root: dir,
  build: {
    minify: true,
    cssMinify: true,
    manifest: true,
    sourcemap: true
  },
  plugins: [
    tsconfigPaths({ projects: [join(dir, "./tsconfig.build.json")] }),
    compression(),
    // @ts-expect-error
    visualizer({
      gzipSize: true,
      brotliSize: true
    }),
    vavite({
      serverEntry: join(src, "server.ts"),
      serveClientAssetsInDev: true,
      // Don't reload when dynamically imported dependencies change
      reloadOn: "static-deps-change"
    }),
    exposeAssetManifest(join(dir, "dist/client/.vite/manifest.json"))
  ]
})

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
        return `export default ${JSON.stringify((await import(path, { with: { type: "json" } })).default, null, 2)}`
      }
    }
  }
}
