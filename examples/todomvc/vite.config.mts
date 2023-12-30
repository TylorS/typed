import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import topLevelAwait from "vite-plugin-top-level-await"

const exclusions = ["fx", "router", "template"].flatMap((pkg) => [
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
    sourcemap: true
  },
  plugins: [
    topLevelAwait({}),
    compression(),
    visualizer({
      gzipSize: true,
      brotliSize: true
    })
  ]
})
