import { writeFileSync } from 'fs'
import { EOL } from 'os'
import { join } from 'path'
import rimraf from 'rimraf'

import { compiledFiles, MODULES, readRelativeFile, ROOT_DIR, ROOT_FILES } from './common'

const GITIGNORE = join(ROOT_DIR, '.gitignore')
const GITIGNORE_TEMPLATE = readRelativeFile(import.meta, '.gitignore-template')

function updateGitIgnore(template: string, modules: ReadonlyArray<string>) {
  return (
    [
      template.trim(),
      ...ROOT_FILES.reduce(
        (acc: ReadonlyArray<string>, file) => [...acc, ...compiledFiles(file)],
        [],
      ),
      ...modules.map((m) => `/${m}/`),
    ].join(EOL) + EOL
  )
}

const updatedGitIgnore = updateGitIgnore(GITIGNORE_TEMPLATE, MODULES)

rimraf.sync(GITIGNORE)
writeFileSync(GITIGNORE, updatedGitIgnore)
