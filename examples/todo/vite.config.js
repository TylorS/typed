/* eslint-disable no-undef */

import { join } from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({ root: join(__dirname, '../../') })],
  build: {
    outDir: join(__dirname, 'build'),
    sourcemap: true,
    manifest: true,
    emptyOutDir: true,
  },
  server: {
    port: 7777,
  },
})
