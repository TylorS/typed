import { Options } from './Options.js'
import { VirtualModule } from './VirtualModule.js'
import { VirtualModulePlugin } from './VirtualModulePlugin.js'
import { VIRTUAL_ID_PREFIX } from './constants.js'

export class VirtualModuleManager {
  readonly plugins: readonly VirtualModulePlugin[]

  protected idToPluginCache = new Map<string, VirtualModulePlugin>()
  protected idToVirtualModuleCache = new Map<string, VirtualModule>()
  protected dependencies = new Map<string, Set<string>>()
  protected dependents = new Map<string, Set<string>>()

  constructor(
    readonly options: Options,
    plugins: ReadonlyArray<(options: Options) => VirtualModulePlugin>,
  ) {
    this.plugins = plugins.map((Plugin) => Plugin(options))
  }

  resolveId(moduleId: string, importer: string): string | undefined {
    for (const plugin of this.plugins) {
      for (const prefix of plugin.prefixes) {
        if (moduleId.startsWith(prefix)) {
          const resolvedId = plugin.resolveId(moduleId, importer)

          if (!resolvedId) {
            continue
          }

          const id = VIRTUAL_ID_PREFIX + resolvedId

          this.idToPluginCache.set(id, plugin)

          return id
        }
      }
    }
  }

  load(id: string, importer: string): VirtualModule | undefined {
    const plugin = this.idToPluginCache.get(id)

    if (!plugin) {
      return
    }

    const virtualModule = plugin.load(id.slice(VIRTUAL_ID_PREFIX.length), importer)

    if (!virtualModule) {
      return
    }

    this.idToVirtualModuleCache.set(id, virtualModule)
    this.addDependencies(virtualModule.id, virtualModule.dependencies)

    return virtualModule
  }

  onFileChange(change: FileChange) {
    switch (change._tag) {
      case 'Add':
        return this.addFile(change)
      case 'Remove':
        return this.removeFile(change)
      case 'Update':
        return this.updateFile(change)
      case 'Move':
        return this.moveFile(change)
    }
  }

  buildManifest() {
    // TODO: Build manifest file
    return {}
  }

  protected addDependencies(id: string, dependencies: ReadonlyArray<string>) {
    for (const dependency of dependencies) {
      this.addDependency(id, dependency)
      this.addDependent(dependency, id)
    }
  }

  protected addDependency(id: string, dependency: string) {
    const dependencies = this.dependencies.get(id) ?? new Set()

    dependencies.add(dependency)

    this.dependencies.set(id, dependencies)
  }

  protected addDependent(id: string, dependent: string) {
    const dependents = this.dependents.get(id) ?? new Set()

    dependents.add(dependent)

    this.dependents.set(id, dependents)
  }

  protected addFile(change: AddFile) {
    // TODO: Add file
  }

  protected removeFile(change: RemoveFile) {
    // TODO: Remove file
  }

  protected updateFile(change: UpdateFile) {
    // TODO: Update file
  }

  protected moveFile(change: MoveFile) {
    // TODO: Move file
  }
}

export type FileChange = AddFile | RemoveFile | UpdateFile | MoveFile

export interface AddFile {
  readonly _tag: 'Add'
  readonly filePath: string
}

export interface RemoveFile {
  readonly _tag: 'Remove'
  readonly filePath: string
}

export interface UpdateFile {
  readonly _tag: 'Update'
  readonly filePath: string
}

export interface MoveFile {
  readonly _tag: 'Move'
  readonly from: string
  readonly to: string
}
