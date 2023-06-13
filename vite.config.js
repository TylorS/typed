import { join } from 'path'

import { defineConfig } from 'vite'

import typed from './packages/vite-plugin'

// Only necessary because developing in a monorepo dogfooding my own source code.
const alias = {
  '@typed/compiler': join(__dirname, 'packages/compiler/dist'),
  '@typed/context': join(__dirname, 'packages/context/dist'),
  '@typed/decoder': join(__dirname, 'packages/decoder/dist'),
  '@typed/dom': join(__dirname, 'packages/dom/dist'),
  '@typed/error': join(__dirname, 'packages/error/dist'),
  '@typed/framework': join(__dirname, 'packages/framework/dist'),
  '@typed/fx': join(__dirname, 'packages/fx/dist'),
  '@typed/html': join(__dirname, 'packages/html/dist'),
  '@typed/path': join(__dirname, 'packages/path/dist'),
  '@typed/route': join(__dirname, 'packages/route/dist'),
  '@typed/router': join(__dirname, 'packages/router/dist'),
}

const exampleDir = join(__dirname, 'example')

export default defineConfig(() => {
  return {
    resolve: { alias },
    plugins: [
      typed({
        sourceDirectory: exampleDir,
      }),
    ],
    build: {
      manifest: true,
      sourcemap: true,
      minify: true,
    },
    test: {
      checker: 'tsc',
    },
  }
})
