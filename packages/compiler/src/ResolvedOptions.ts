import type { Option } from '@effect/data/Option'

export interface ResolvedOptions {
  readonly base: string
  readonly clientOutputDirectory: string
  readonly debug: boolean
  readonly exclusions: readonly string[]
  readonly htmlFiles: readonly string[]
  readonly isStaticBuild: boolean
  readonly saveGeneratedModules: boolean
  readonly serverFilePath: Option<string>
  readonly serverOutputDirectory: string
  readonly sourceDirectory: string
  readonly tsConfig: string
}
