/// <reference types="vavite/vite-config" />

import { join } from 'path'

import vavite from 'vavite'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ command }) => ({
  buildSteps: [
    {
      name: 'client',
      config: {
        build: {
          outDir: 'dist/client',
          manifest: true,
          rollupOptions: { input: './example/index.html' },
        },
      },
    },
    {
      name: 'server',
      config: {
        build: {
          ssr: true,
          outDir: 'dist/server',
        },
      },
    },
  ],
  plugins: [
    tsconfigPaths({
      projects: [join(__dirname, 'example', 'tsconfig.json')],
    }),
    vavite({
      serverEntry: command === 'serve' ? './server.ts' : './example/server.ts',
      serveClientAssetsInDev: true,
      // Don't reload when dynamically imported dependencies change
      reloadOn: 'static-deps-change',
    }),
    viteCompression(),
  ],
  build: {
    manifest: true,
    sourcemap: true,
    minify: true,
  },
}))
