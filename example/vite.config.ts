import vavite from 'vavite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vavite({
      serverEntry: './server.ts',
      reloadOn: 'static-deps-change',
      serveClientAssetsInDev: true,
    }),
  ],
})
