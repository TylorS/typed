import { defineConfig } from 'vite'

const packages = [
  'context',
  'decoder',
  'dom',
  'error',
  'framework',
  'fx',
  'html',
  'navigation',
  'path',
  'route',
  'router',
  'virtual-module',
  'wire',
]

export default defineConfig(() => {
  return {
    optimizeDeps: {
      exclude: packages.map((pkg) => `@typed/${pkg}`),
      force: true,
    },
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
