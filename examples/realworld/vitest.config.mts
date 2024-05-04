/// <reference types="vitest" />

import babel from "@vitejs/plugin-react"
import tsconfigPaths from "vite-plugin-tsconfig-paths"

import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("../../.babel.mjs.json")

function makeTestConfig(
  directory: string,
  testPath: string | Array<string> = "./test/*.ts",
  tsConfigFileName: string = "tsconfig.test.json"
) {
  return defineConfig({
    plugins: [
      babel({ babel: babelConfig }),
      tsconfigPaths({
        tsConfigPath: join(directory, tsConfigFileName)
      })
    ],
    resolve: {
      alias: {
        "@realworld": join(directory, "src")
      }
    },
    test: {
      watch: process.env.WATCH === "true",
      include: Array.isArray(testPath) ? testPath : [testPath],
      exclude: [
        "**/test/type-level/*",
        "**/test/helpers/*",
        "**/test/fixtures/*"
      ],
      globals: true
    }
  })
}

export default makeTestConfig(
  dirname(fileURLToPath(import.meta.url)),
  "./test/*.ts",
  "tsconfig.test.json"
)
