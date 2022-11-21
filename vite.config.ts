import * as vite from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default vite.defineConfig({
  plugins: [tsconfigPaths({ root: '../../', projects: ['tsconfig.base.json'] })],
  build: {
    sourcemap: true,
  },
})
