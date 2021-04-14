import { existsSync, readdirSync, statSync } from 'fs'
import { basename, dirname, join } from 'path'
import rimraf from 'rimraf'

import { MODULES, ROOT_DIR } from './common'

rimraf.sync(join(ROOT_DIR, 'build'))
rimraf.sync(join(ROOT_DIR, 'cjs'))
rimraf.sync(join(ROOT_DIR, 'esm'))

// Delete any directories that have only a package.json within them
readdirSync(ROOT_DIR)
  .map((p) => join(ROOT_DIR, p))
  .filter((p) => statSync(p).isDirectory())
  .map((dir) => readdirSync(dir).map((p) => join(dir, p)))
  .filter((files) => files.length === 1 && basename(files[0]) === 'package.json')
  .flat()
  .forEach((file) => rimraf.sync(dirname(file)))

MODULES.map((m) => join(ROOT_DIR, m))
  .filter((p) => existsSync(p) && statSync(p).isDirectory())
  .forEach((dir) => rimraf.sync(dir))
