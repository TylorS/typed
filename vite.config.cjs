import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    sourcemap: true,
    manifest: true,
    emptyOutDir: true,
  },
})
