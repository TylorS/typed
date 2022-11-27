import * as fs from 'node:fs'
import { EOL } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const packagesDir = join(root, 'packages')

const packageNames = fs
  .readdirSync(packagesDir)
  .filter((name) => fs.statSync(join(packagesDir, name)).isDirectory())

const currentConfig = JSON.parse(fs.readFileSync(join(root, 'tsconfig.json'), 'utf-8').toString())

currentConfig.references = packageNames.map((name) => ({
  path: `./packages/${name}/tsconfig.build.json`,
}))

fs.writeFileSync(join(root, 'tsconfig.json'), JSON.stringify(currentConfig, null, 2) + EOL)
