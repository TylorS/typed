import { writeFileSync } from 'fs'
import { join } from 'path'

import { MODULES, readRelativeFile, ROOT_DIR } from './common'

const PACKAGE_JSON_TEMPLATE = readRelativeFile(import.meta, 'package-template.json')

function createTemplate(name: string) {
  const directory = join(ROOT_DIR, name)
  const packageJsonPath = join(directory, 'package.json')
  const packageJsonContents = PACKAGE_JSON_TEMPLATE

  writeFileSync(packageJsonPath, packageJsonContents)
}

MODULES.forEach(createTemplate)
