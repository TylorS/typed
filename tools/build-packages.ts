import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as rimraf from 'rimraf'

import { MODULES, readRelativeFile, ROOT_DIR } from './common'

const NAME_REGEX = new RegExp('%name%', 'g')
const PACKAGE_JSON_TEMPLATE = readRelativeFile(__dirname, 'package-template.json')

function createTemplate(name: string) {
  const directory = join(ROOT_DIR, name)

  if (existsSync(directory)) {
    rimraf.sync(directory)
  }

  mkdirSync(directory)

  const packageJsonPath = join(directory, 'package.json')
  const packageJsonContents = PACKAGE_JSON_TEMPLATE.replace(NAME_REGEX, name)

  writeFileSync(packageJsonPath, packageJsonContents)
}

MODULES.forEach(createTemplate)
