import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'

const ROOT_DIR = join(__dirname, '..')
const SOURCE_DIR = join(ROOT_DIR, 'src')
const modules = readdirSync(SOURCE_DIR).filter((x) => statSync(join(SOURCE_DIR, x)).isDirectory())

modules.forEach((m) => rimraf.sync(join(ROOT_DIR, m)))
