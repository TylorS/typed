import { writeFileSync } from 'fs'
import { EOL } from 'os'
import { join, resolve } from 'path'

import yargs from 'yargs'

import { buildClientSideEntrypoint } from './buildClientSideEntrypoint.js'
import { buildServerEntrypoint } from './buildServerEntrypoint.js'
import { scanSourceFiles } from './scanSourceFiles.js'
import { setupTsProject } from './setupTsProject.js'

const cwd = process.cwd()

const { directory, modules, tsConfig, environment, out } = yargs(process.argv.slice(2), cwd)
  .option('directory', {
    type: 'string',
    required: true,
  })
  .option('modules', {
    type: 'string',
    array: true,
    default: ['pages/**/*.ts', 'pages/**/*.tsx', 'workflows/**/*.ts', 'workflows/**/*.tsx'],
  })
  .option('tsConfig', {
    type: 'string',
    default: 'tsconfig.json',
  })
  .option('environment', {
    type: 'string',
    choices: ['browser', 'server', 'static'],
    required: true,
  })
  .option('out', {
    type: 'string',
    required: true,
  })
  .help()
  .parseSync()

const dir = resolve(cwd, directory)
const outFile = resolve(cwd, out)
const project = setupTsProject(resolve(dir, tsConfig))
const scanned = scanSourceFiles(
  modules.map((m) => resolve(dir, m)),
  project,
)

const entrypoint = buildEntryPoint()

writeFileSync(outFile, entrypoint.getFullText() + EOL)

function buildEntryPoint() {
  if (environment === 'browser') {
    return buildClientSideEntrypoint(scanned, project, outFile)
  }

  if (environment === 'server') {
    // TODO: Better handle client directory
    return buildServerEntrypoint(scanned, project, join(dir, 'index.html'), outFile)
  }

  throw new Error(`Unsupported environment: ${environment}`)
}
