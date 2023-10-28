import { defineConfig } from "vite"
import compression from "vite-plugin-compression"
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
    compression()
  ]
})
