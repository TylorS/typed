import * as fs from 'node:fs'
import { EOL } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const packagesDir = join(root, 'packages')

const packageNames = fs.readdirSync(packagesDir).filter((name) => {
  const packageDir = join(packagesDir, name)
  const packageJsonPath = join(packageDir, 'package.json')

  if (!fs.statSync(join(packagesDir, name)).isDirectory() || !fs.existsSync(packageJsonPath)) {
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8').toString())

  return packageJson.private !== true
})

const currentConfig = JSON.parse(fs.readFileSync(join(root, 'tsconfig.json'), 'utf-8').toString())

currentConfig.references = packageNames.map((name) => ({
  path: `./packages/${name}/tsconfig.build.json`,
}))

fs.writeFileSync(join(root, 'tsconfig.json'), JSON.stringify(currentConfig, null, 2) + EOL)
