/// <reference types="vitest" />

import { makeTestConfigFromImportMetaUrl } from "../../vitest.config.mjs"

export default makeTestConfigFromImportMetaUrl(import.meta.url)
