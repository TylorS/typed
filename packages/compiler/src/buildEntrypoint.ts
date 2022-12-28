import { Environment } from '@typed/html'
import { Project, SourceFile } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildClientSideEntrypoint } from './buildClientSideEntrypoint.js'
import { buildExpressEntrypoint } from './buildExpressEntrypoint.js'

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
    return buildExpressEntrypoint(scanned, project, outFile)
  }

  throw new Error(`Unsupported environment: ${environment}`)
}
