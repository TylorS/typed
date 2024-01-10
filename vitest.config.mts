/// <reference types="vitest" />

import babel from "@vitejs/plugin-react"
import tsconfigPaths from "vite-plugin-tsconfig-paths"

import { readdirSync, statSync } from "fs"
import { createRequire } from "module"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vite"

const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("./.babel.mjs.json")

export function makeTestConfig(
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
    test: {
      watch: process.env.WATCH === "true",
      include: Array.isArray(testPath) ? testPath : [testPath],
      exclude: [
        "**/test/type-level/*",
        "**/test/helpers/*",
        "**/test/fixtures/*"
      ],
      globals: true,
      typecheck: {
        checker: "tsc"
      }
    }
  })
}

const directory = dirname(fileURLToPath(import.meta.url))

const packages = readdirSync(join(directory, "packages"))
  .filter(hasTestDirectory)
  .map((pkg) => `./packages/${pkg}/test/**/*.ts`)

function hasTestDirectory(pkg: string) {
  const dir = join(directory, "packages", pkg)
  const stat = statSync(dir)

  if (!stat.isDirectory()) return false

  try {
    return statSync(join(dir, "test")).isDirectory()
  } catch {
    return false
  }
}

export default makeTestConfig(directory, packages, "tsconfig.json")
