import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
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
