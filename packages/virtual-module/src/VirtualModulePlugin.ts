import { Extension, LanguageService, ModuleKind } from 'typescript'

export interface VirtualModulePlugin<Metadata, M extends VirtualModule = VirtualModule> {
  /**
   * Unique name of the plugin.
   */
  readonly name: string

  /**
   * Called to check if a file should be handled by the plugin.
   */
  readonly regex: RegExp

  /**
   * Called to resolve the file name of a virtual module.
   */
  readonly resolveVirtualModule: (id: string, importer: string) => M

  /**
   * Resolve metadata for a virtual module that will be passed to `generateTypeScriptContent` and `generateProductionContent`.
   */
  readonly generateMetadata: (module: M, params: VirtualModuleGenerateMetadataParams) => Metadata

  /**
   * Called to resolve the source code of a virtual module. It's important to note that
   * this is the variant that will always be utilized for our TypeScript plugin and therefore
   * must be synchronous.
   */
  readonly generateTypeScriptContent: (
    module: M,
    params: VirtualModuleGenerateContentParams<Metadata>,
  ) => string

  /**
   * Called when building for production with our vite plugin.
   * It is an optional method that can be used to generate the content of a virtual module
   * that depends on the environment. Otherwise the `generateContent` method will be used.
   */
  readonly generateProductionContent?: (
    module: M,
    params: VirtualModuleGenerateContentParams<Metadata>,
    productionParams: ProductionParams,
  ) => Promise<string>
}

export interface ProductionParams {
  readonly base: string
  readonly clientOutputDirectory: string
  readonly environment: 'browser' | 'server' | 'static'
  readonly serverOutputDirectory: string
  readonly sourceDirectory: string
  readonly assetDirectory: string
  readonly transformHtml?: (html: string) => Promise<string>
}

export interface VirtualModuleFilePlugin<Metadata>
  extends VirtualModulePlugin<Metadata, VirtualModuleFile> {}

export interface VirtualModuleDirectoryPlugin<Metadata>
  extends VirtualModulePlugin<Metadata, VirtualModuleDirectory> {}

export type VirtualModule = VirtualModuleFile | VirtualModuleDirectory

export interface VirtualModuleFile {
  readonly _tag: 'File'
  readonly id: string
  readonly importer: string
  readonly fileName: string
  readonly kind: ModuleKind
  readonly extension: Extension
}

export function VirtualModuleFile(params: Omit<VirtualModuleFile, '_tag'>): VirtualModuleFile {
  return {
    _tag: 'File',
    ...params,
  }
}

export interface VirtualModuleDirectory {
  readonly _tag: 'Directory'
  readonly id: string
  readonly importer: string
  readonly fileName: string
  readonly sourceDirectory: string
  readonly sourceDirectoryGlobs: string[]
  readonly kind: ModuleKind
  readonly extension: Extension
}

export function VirtualModuleDirectory(
  params: Omit<VirtualModuleDirectory, '_tag'>,
): VirtualModuleDirectory {
  return {
    _tag: 'Directory',
    ...params,
  }
}

export interface VirtualModuleGenerateMetadataParams {
  readonly params: Record<string, any>
  readonly languageService: LanguageService
}

export interface VirtualModuleGenerateContentParams<Metadata>
  extends VirtualModuleGenerateMetadataParams {
  readonly metadata: Metadata
}
