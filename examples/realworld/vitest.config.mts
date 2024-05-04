/// <reference types="vitest" />

import { dirname } from "path"
import { fileURLToPath } from "url"
import { defineConfig, mergeConfig } from "vite"
import { makeTestConfig } from "../../vitest-make-config.mjs"

const directory = dirname(fileURLToPath(import.meta.url))
const config = mergeConfig(
  makeTestConfig(directory),
  defineConfig({
    optimizeDeps: {
      include: [
        "@typed/fx",
        "@typed/template",
        "@typed/async-data",
        "@typed/core",
        "@typed/navigation",
        "@typed/router",
        "effect",
        "@effect/schema"
      ]
    },
    test: {}
  })
)

export default config
