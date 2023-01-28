import type { ApiModuleTreeJson, ModuleTreeJsonWithFallback } from './json.js'

export interface Manifest {
  readonly entryFiles: EntryFile[]

  readonly modules: {
    [importer: string]: Record<string, ManifestEntry>
  }
}

export interface ClientManifest extends Manifest {
  readonly entryFiles: HtmlEntryFile[]

  readonly modules: {
    [importer: string]: Record<string, ManifestEntry>
  }
}

export type EntryFile = HtmlEntryFile | TsEntryFile

export interface HtmlEntryFile {
  readonly type: 'html'
  readonly filePath: string
  readonly imports: string[]
  readonly basePath: string
}

export interface TsEntryFile {
  readonly type: 'ts'
  readonly filePath: string
}

export type ManifestEntry =
  | ApiManifestEntry
  | ExpressManifestEntry
  | HtmlManifestEntry
  | RuntimeManifestEntry
  | BrowserManifestEntry

export interface ApiManifestEntry extends ApiModuleTreeJson {
  readonly type: 'api'
}

export interface ExpressManifestEntry extends ApiModuleTreeJson {
  readonly type: 'express'
}

export interface HtmlManifestEntry {
  readonly type: 'html'
  readonly filePath: string
}

export interface BrowserManifestEntry extends ModuleTreeJsonWithFallback {
  readonly type: 'browser'
}

export interface RuntimeManifestEntry extends ModuleTreeJsonWithFallback {
  readonly type: 'runtime'
}
