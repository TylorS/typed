import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({ root: '../../', projects: ['tsconfig.base.json'] })],
  build: {
    sourcemap: true,
  },
})
