import { join } from "path"
import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import topLevelAwait from "vite-plugin-top-level-await"
import tsconfigPaths from "vite-tsconfig-paths"

const exclusions = ["fx", "router", "template", "ui"].flatMap((pkg) => [
  `@typed/${pkg}`,
  `@typed/${pkg}/*`
])

export default defineConfig({
  optimizeDeps: {
    exclude: exclusions
  },
  build: {
    minify: true,
    cssMinify: true,
    manifest: true,
    sourcemap: true,
    ssr: true,
    ssrManifest: true,
    rollupOptions: {
      input: {
        server: "src/server.ts"
      }
    }
  },
  plugins: [
    topLevelAwait({}),
    tsconfigPaths({ projects: [join(import.meta.dirname, "./tsconfig.build.json")] }),
    compression()
  ]
})
