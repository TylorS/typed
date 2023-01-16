import type { SourceFile } from 'ts-morph'

import type { EnvironmentSourceFileModule } from './SourceFileModule.js'

export interface ApiModuleTree {
  readonly directory: string
  readonly modules: readonly ApiSourceFileModule[]
  readonly environment?: EnvironmentSourceFileModule
  readonly children: readonly ApiModuleTree[]
}

export interface ApiSourceFileModule {
  readonly _tag: 'Api'
  readonly sourceFile: SourceFile
  readonly handlerExportNames: readonly string[]
  readonly hasEnvironment: boolean
}
