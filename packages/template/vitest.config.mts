/// <reference types="vitest" />

import { dirname } from "path"
import { fileURLToPath } from "url"
import { mergeConfig } from "vite"
import { makeTestConfig } from "../../vitest.config.mjs"

export default mergeConfig(makeTestConfig(dirname(fileURLToPath(import.meta.url)), "test/Html.ts"), {
  test: {}
})
