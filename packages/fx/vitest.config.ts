/// <reference types="vitest" />
import babel from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("../../.babel.mjs.json")

export default defineConfig({
  plugins: [babel({ babel: babelConfig })],
  test: {
    include: ["./test/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@typed/fx/test": path.join(__dirname, "test"),
      "@typed/fx": path.join(__dirname, "src"),
    },
  },
})