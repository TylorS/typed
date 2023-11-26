/// <reference types="vitest" />

import babel from "@vitejs/plugin-react"
import tsconfigPaths from "vite-plugin-tsconfig-paths"

import { join } from "path"
import { defineConfig } from "vite"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("./.babel.mjs.json")

export function makeTestConfig(
  directory: string,
  testPath: string = "./test/*.ts",
  tsConfigFileName: string = "tsconfig.test.json"
) {
  return defineConfig({
    plugins: [
      babel({ babel: babelConfig }),
      tsconfigPaths({
        tsConfigPath: join(directory, tsConfigFileName)
      })
    ],
    test: {
      include: [testPath],
      exclude: ["**/test/type-level/*.ts", "**/test/helpers/*", "**/test/fixtures/*"],
      globals: true,
      typecheck: {
        checker: "tsc"
      }
    }
  })
}

export default makeTestConfig(__dirname, "packages/*/test/**/*.ts", "tsconfig.json")
