import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { EOL } from 'os'
import { join } from 'path'
import rimraf from 'rimraf'

const ROOT_DIR = join(__dirname, '..')
const SOURCE_DIR = join(ROOT_DIR, 'src')

export const MODULES: ReadonlyArray<string> = readdirSync(SOURCE_DIR)
  .sort()
  .filter((path) => statSync(join(SOURCE_DIR, path)).isDirectory())

const GITIGNORE = join(ROOT_DIR, '.gitignore')
const GITIGNORE_TEMPLATE = readFileSync(join(__dirname, '.gitignore-template')).toString()

function updateGitIgnore(template: string, modules: ReadonlyArray<string>) {
  return [template.trim(), ...modules.map((m) => `/${m}/`)].join(EOL) + EOL
}

const updatedGitIgnore = updateGitIgnore(GITIGNORE_TEMPLATE, MODULES)

rimraf.sync(GITIGNORE)
writeFileSync(GITIGNORE, updatedGitIgnore)
