/// <reference types="vitest" />

import babel from "@vitejs/plugin-react"
import tsconfigPaths from "vite-plugin-tsconfig-paths"

import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineProject } from "vitest/config"

const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("./.babel.mjs.json")

export function makeTestConfig(
  directory: string,
  testPath: string | Array<string> = "./test/*.ts",
  tsConfigFileName: string = "tsconfig.test.json"
) {
  return defineProject({
    plugins: [
      babel({ babel: babelConfig }),
      tsconfigPaths({
        tsConfigPath: join(directory, tsConfigFileName)
      })
    ],
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

export function makeTestConfigFromImportMetaUrl(
  url: string,
  testPath: string | Array<string> = "./test/*.ts",
  tsConfigFileName: string = "tsconfig.test.json"
) {
  return makeTestConfig(dirname(fileURLToPath(url)), testPath, tsConfigFileName)
}
