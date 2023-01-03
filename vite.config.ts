/// <reference types="vavite/vite-config" />

import { join } from 'path'

import { defineConfig } from 'vite'
import compression from 'vite-plugin-compression'

import typed from './packages/vite-plugin/src/vite-plugin'

export default defineConfig({
  plugins: [
    typed({
      // Directory should point towards the root of your project with an index.html file
      directory: join(__dirname, 'example'),
      // Globs to search for routes and renderables. Can be absolute path or relative to directory above
      pages: ['pages/**/*'],
      // Path to your tsconfig.json file. Can be absolute path or relative to directory above
      tsConfig: 'tsconfig.json',
    }),
    compression(),
  ],
  build: {
    manifest: true,
    sourcemap: true,
    minify: true,
  },
})
