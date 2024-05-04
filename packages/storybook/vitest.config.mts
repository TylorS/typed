/// <reference types="vitest" />

import { makeTestConfigFromImportMetaUrl } from "../../vitest-make-config.mjs"

export default makeTestConfigFromImportMetaUrl(import.meta.url)
