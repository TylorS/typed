/// <reference types="vavite/vite-config" />

import { join } from 'path'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'
import { defineConfig } from 'vite'

import typed from './packages/vite-plugin/src/vite-plugin'

const isStaticBuild = process.env.STATIC_BUILD === 'true'

export default defineConfig({
  root: join(__dirname, 'example'),
  ...(isStaticBuild ? { mode: 'production' } : {}),
  resolve: {
    // Only necessary because developing in a monorepo dogfooding my own source code.
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
    typed({
      // Directory should point towards the root of your project with an index.html file
      sourceDirectory: join(__dirname, 'example'),
      saveGeneratedModules: true,
      isStaticBuild,
    }),
    svelte({
      preprocess: autoPreprocess(),
      compilerOptions: {
        hydratable: true,
      },
    }),
  ],
  build: {
    manifest: true,
    sourcemap: true,
    minify: true,
  },
})
