import { join } from 'path'
import rimraf from 'rimraf'
import { compiledFiles, MODULES, ROOT_DIR, ROOT_FILES } from './common'

ROOT_FILES.flatMap(compiledFiles).forEach((f) => rimraf.sync(f.replace('/', '')))
MODULES.map((m) => join(ROOT_DIR, m)).forEach((d) => rimraf.sync(d))
