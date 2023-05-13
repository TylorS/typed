import { LanguageService } from 'typescript'

export interface VirtualModulePlugin<Metadata> {
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
  readonly resolveVirtualModule: (id: string, importer: string) => VirtualModule | undefined

  /**
   * Resolve metadata for a virtual module that will be passed to `generateContent`.
   */
  readonly generateMetadata: (module: VirtualModule, languageService: LanguageService) => Metadata

  /**
   * Called to resolve the source code of a virtual module.
   */
  readonly generateContent: (module: VirtualModule, metadata: Metadata) => string | undefined
}

export type VirtualModule = VirtualModuleFile | VirtualModuleDirectory

export interface VirtualModuleFile {
  readonly _tag: 'File'
  readonly id: string
  readonly importer: string
  readonly fileName: string
  readonly sourceFileName: string
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
}

export function VirtualModuleDirectory(
  params: Omit<VirtualModuleDirectory, '_tag'>,
): VirtualModuleDirectory {
  return {
    _tag: 'Directory',
    ...params,
  }
}
