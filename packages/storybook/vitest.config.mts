/// <reference types="vitest" />

import { dirname } from "path"
import { fileURLToPath } from "url"
import { makeTestConfig } from "../../vitest.config.mjs"

export default makeTestConfig(dirname(fileURLToPath(import.meta.url)))
