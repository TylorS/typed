import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['tsconfig.json'] })],
  build: {
    sourcemap: true,
  },
})
