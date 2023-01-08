/// <reference types="vavite/vite-config" />

import { join } from 'path'

import vavite from 'vavite'
import { defineConfig } from 'vite'
import compression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

import typed from './packages/vite-plugin/src/vite-plugin'

export default defineConfig(() => ({
  root: join(__dirname, 'example'),
  resolve: {
    // Only necessary because developing in a monorepo
    alias: {
      '@typed/compiler': join(__dirname, 'packages/compiler/dist'),
      '@typed/context': join(__dirname, 'packages/context/dist'),
      '@typed/dom': join(__dirname, 'packages/dom/dist'),
      '@typed/framework': join(__dirname, 'packages/framework/dist'),
      '@typed/fx': join(__dirname, 'packages/fx/dist'),
      '@typed/html': join(__dirname, 'packages/html/dist'),
      '@typed/path': join(__dirname, 'packages/path/dist'),
      '@typed/route': join(__dirname, 'packages/route/dist'),
      '@typed/router': join(__dirname, 'packages/router/dist'),
    },
  },
  plugins: [
    tsconfigPaths({
      projects: [join(__dirname, 'example/tsconfig.json')],
    }),
    typed({
      // Directory should point towards the root of your project with an index.html file
      directory: join(__dirname, 'example'),
      // Path to your tsconfig.json file. Can be absolute path or relative to directory above
      tsConfig: 'tsconfig.json',
    }),
    vavite({
      serverEntry: join(__dirname, 'example/server.ts'),
      serveClientAssetsInDev: true,
    }),
    compression(),
  ],
  build: {
    manifest: true,
    sourcemap: true,
    minify: true,
  },
}))
