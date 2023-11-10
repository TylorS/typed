import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
import topLevelAwait from "vite-plugin-top-level-await"
import tsconfigPaths from "vite-plugin-tsconfig-paths"

export default defineConfig({
  build: {
    minify: true,
    cssMinify: true,
    manifest: true,
    sourcemap: true
  },
  plugins: [
    tsconfigPaths({}),
    topLevelAwait({}),
    compression()
  ]
})
