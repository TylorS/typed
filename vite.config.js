import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
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
