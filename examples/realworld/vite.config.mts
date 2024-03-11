import { dirname, join } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { fileURLToPath } from "url"
import { vavite } from "vavite"
import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import tsconfigPaths from "vite-tsconfig-paths"

const exclusions = ["fx", "router", "template", "ui"].flatMap((pkg) => [
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
  build: {
    minify: true,
    cssMinify: true,
    manifest: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@/api": join(src, "api"),
      "@/domain": join(src, "domain"),
      "@/lib": join(src, "lib"),
      "@/services": join(src, "services"),
      "@/ui": join(src, "ui")
    }
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
    })
  ]
})
