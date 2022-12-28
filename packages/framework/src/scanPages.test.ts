import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it } from 'vitest'

const srcDirectory = fileURLToPath(dirname(import.meta.url))
const rootDirectory = dirname(dirname(srcDirectory))
const examplesDirectory = join(rootDirectory, 'example')

describe(import.meta.url, () => {
  describe('scanPages', () => {
    it('allows extracting information from source files', async () => {})
  })
})
