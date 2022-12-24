import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  resolve: {
    alias: {
      '@typed/context/*': './packages/context/dist/*',
      '@typed/dom/*': './packages/dom/dist/*',
      '@typed/framework/*': './packages/framework/dist/*',
      '@typed/fx/*': './packages/fx/dist/*',
      '@typed/html/*': './packages/html/dist/*',
      '@typed/node/*': './packages/node/dist/*',
      '@typed/path/*': './packages/path/dist/*',
      '@typed/route/*': './packages/route/dist/*',
      '@typed/router/*': './packages/router/dist/*',
    },
  },
  plugins: [tsconfigPaths({ projects: ['tsconfig.json'] })],
  build: {
    sourcemap: true,
  },
})
