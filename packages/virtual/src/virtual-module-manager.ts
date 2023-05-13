import ts from 'typescript'

import { ResolveFileNameParams, VirtualModulePlugin } from './virtual-module'

export class VirtualModuleManager {
  protected idToPlugin = new Map<string, VirtualModulePlugin>()
  protected idToFilePath = new Map<string, string>()
  protected idToImporter = new Map<string, string>()
  protected idToContent = new Map<string, string>()
  protected filePathToId = new Map<string, string>()

  constructor(
    readonly plugins: readonly VirtualModulePlugin[],
    readonly log: (msg: string) => void,
  ) {}

  /**
   * Check to see if there is a plugin configured to resolve the given id.
   */
  readonly match = (id: string): boolean => !!this.getPluginById(id)

  /**
   * Check to see if the given file name has been resolved to a virtual module id.
   */
  readonly hasFileName = (fileName: string): boolean => this.filePathToId.has(fileName)

  /**
   * Should only be called AFTER `match` has been called. Converts a virtual module id
   * to a real file path.
   */
  readonly resolveFileName = (params: ResolveFileNameParams): string => {
    const fileName = // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getPluginById(params.id)!.resolveFileName({
        ...params,
      })

    this.log(`Resolved ${params.id} to ${fileName}`)

    this.idToFilePath.set(params.id, fileName)
    this.idToImporter.set(params.id, params.importer)
    this.filePathToId.set(fileName, params.id)

    return fileName
  }

  /**
   * Should only be called AFTER `match` has been called.
   * Returns the contents of the virtual module for a given file name.
   */
  readonly createContent = (fileName: string, getProgram: () => ts.Program): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = this.filePathToId.get(fileName)!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const importer = this.idToImporter.get(id)!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const content = this.getPluginById(id)!.createContent({
      id,
      fileName,
      importer,
      getProgram,
      log: this.log,
    })

    this.idToContent.set(id, content)

    // // Add the file to the project
    // this.projectFiles.set(fileName, ts.ScriptSnapshot.fromString(content))

    return content
  }

  protected getPluginById(id: string): VirtualModulePlugin | undefined {
    const cached = this.idToPlugin.get(id)

    if (cached) {
      return cached
    }

    const found = this.plugins.find((plugin) => plugin.match.test(id))

    if (found) {
      this.idToPlugin.set(id, found)

      return found
    }
  }
}
