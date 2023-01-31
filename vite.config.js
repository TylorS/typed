import { join } from 'path'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'
import { defineConfig } from 'vite'

import typed from './packages/vite-plugin/src/vite-plugin'

// Only necessary because developing in a monorepo dogfooding my own source code.
const alias = {
  '@typed/compiler': join(__dirname, 'packages/compiler/dist'),
  '@typed/context': join(__dirname, 'packages/context/dist'),
  '@typed/dom': join(__dirname, 'packages/dom/dist'),
  '@typed/framework': join(__dirname, 'packages/framework/dist'),
  '@typed/fx': join(__dirname, 'packages/fx/dist'),
  '@typed/html': join(__dirname, 'packages/html/dist'),
  '@typed/path': join(__dirname, 'packages/path/dist'),
  '@typed/route': join(__dirname, 'packages/route/dist'),
  '@typed/router': join(__dirname, 'packages/router/dist'),
}

export default defineConfig({
  resolve: { alias },
  plugins: [
    typed({
      // Directory should point towards the root of your project with html files
      sourceDirectory: join(__dirname, 'example'),
      // Allows using includeSources:true for your sourceMaps
      saveGeneratedModules: true,
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
