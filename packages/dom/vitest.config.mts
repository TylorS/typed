/// <reference types="vitest" />

import { dirname } from "path"
import { makeTestConfig } from "../../vitest.config.mjs"
import { fileURLToPath } from "url"

export default makeTestConfig(dirname(fileURLToPath(import.meta.url)))
