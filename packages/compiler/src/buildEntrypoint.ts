import { dirname, join } from 'path'

import { Environment } from '@typed/html'
import { Project, SourceFile } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildClientSideEntrypoint } from './buildClientSideEntrypoint.js'
import { buildServerEntrypoint } from './buildServerEntrypoint.js'

export function buildEntryPoint(
  scanned: SourceFileModule[],
  project: Project,
  environment: Environment,
  outFile: string,
): SourceFile {
  if (environment === 'browser') {
    return buildClientSideEntrypoint(scanned, project, outFile)
  }

  if (environment === 'server') {
    // TODO: How to better acquire client directory?
    return buildServerEntrypoint(scanned, project, join(dirname(outFile), 'index.html'), outFile)
  }

  throw new Error(`Unsupported environment: ${environment}`)
}
