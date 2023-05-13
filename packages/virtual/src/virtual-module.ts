import { Program } from 'typescript'

export interface VirtualModulePlugin {
  readonly name: string

  /**
   * Test if the plugin can handle the given id.
   */
  readonly match: RegExp

  /**
   * Resolve a virtual module to a real file path. This is used to
   * save the generated code to disk if configured to do so, and
   * to resolve the module in the TypeScript compiler.
   */
  readonly resolveFileName: (params: ResolveFileNameParams) => string

  /**
   * Generate the contents of the virtual module.
   */
  readonly createContent: (params: CreateContentParams) => string
}

export interface ResolveFileNameParams {
  readonly id: string
  readonly importer: string
}

export interface CreateContentParams {
  readonly id: string
  readonly fileName: string
  readonly importer: string
  readonly getProgram: () => Program
  readonly log?: (msg: string) => void
}
