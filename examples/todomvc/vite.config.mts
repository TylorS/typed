import { vavite } from "@giacomorebonato/vavite"
import { dirname, join } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { fileURLToPath } from "url"
import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import topLevelAwait from "vite-plugin-top-level-await"

const directory = dirname(fileURLToPath(import.meta.url))

const exclusions = ["fx", "router", "template"].flatMap((pkg) => [
  `@typed/${pkg}`,
  `@typed/${pkg}/*`
])

export default defineConfig({
  buildSteps: [
    {
      name: "client",
      config: {
        build: {
          rollupOptions: {
            input: join(directory, "src/index.html")
          }
        }
      }
    },
    {
      name: "server",
      config: {
        build: { ssr: true }
      }
    }
  ],
  optimizeDeps: {
    exclude: exclusions
  },
  build: {
    minify: true,
    cssMinify: true,
    manifest: true,
    sourcemap: true
  },
  plugins: [
    topLevelAwait({}),
    compression(),
    visualizer({
      gzipSize: true,
      brotliSize: true
    }),
    vavite({
      serverEntry: join(directory, "./src/server.ts"),
      serveClientAssetsInDev: true
    })
  ]
})
