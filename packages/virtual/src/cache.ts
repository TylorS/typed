import ts from 'typescript/lib/tsserverlibrary'

import { VersionedSnapshot } from './snapshot'
import { getCanonicalFileName, normalizePath } from './util'

export class ProjectFileCache {
  private files: Map<string, VersionedSnapshot> = new Map()

  constructor(fileNames: string[], protected info?: ts.server.PluginCreateInfo) {
    fileNames.forEach((fileName) => this.set(fileName))
  }

  has(fileName: string): boolean {
    const normalized = normalizePath(fileName)
    return this.files.has(normalized)
  }

  set(fileName: string, snapshot?: ts.IScriptSnapshot): void {
    const normalized = normalizePath(fileName)

    if (!this.files.has(normalized)) {
      if (this.info) {
        console.log('set', fileName, snapshot?.getText(0, snapshot.getLength()))

        const scriptInfo = this.info.project.projectService.getOrCreateScriptInfoForNormalizedPath(
          ts.server.toNormalizedPath(fileName),
          !!snapshot,
          snapshot ? snapshot.getText(0, snapshot.getLength()) : undefined,
        )

        if (scriptInfo) {
          try {
            this.files.set(normalized, new VersionedSnapshot(normalized, snapshot))
          } catch (e) {
            this.info.project.log('Loading Snapshot failed ' + fileName)
          }
        }
      } else {
        this.files.set(normalized, new VersionedSnapshot(normalized, snapshot))
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Map has the element, and we only store non-null objects
      this.files.get(normalized)!.update(snapshot)
    }
  }

  remove(fileName: string): void {
    const normalized = normalizePath(fileName)
    this.files.delete(normalized)
  }

  removeAll(): void {
    this.files.clear()
  }

  getFileNames(): Iterable<string> {
    return this.files.keys()
  }

  getVersion(fileName: string): string | undefined {
    const normalized = normalizePath(fileName)
    return this.files.get(normalized)?.getVersion()
  }

  getSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const normalized = normalizePath(fileName)
    return this.files.get(normalized)?.getSnapshot()
  }
}

// TODO: the files in this list need to be watched. on change/delete, remove from this list and let the file be re-cached on demand
export class ExternalFileCache {
  private files: Map<string, VersionedSnapshot> = new Map()

  getSnapshot(fileName: string): ts.IScriptSnapshot {
    const normalized = normalizePath(fileName)

    let file = this.files.get(normalized)
    if (!file) {
      file = new VersionedSnapshot(normalized)
      this.files.set(normalized, file)
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Map has the element, and we only store non-null objects
    return this.files.get(normalized)!.getSnapshot()
  }

  has(fileName: string): boolean {
    const normalized = normalizePath(fileName)
    return this.files.has(normalized)
  }
}

export function createModuleResolutionCache(cwd: string, options: ts.CompilerOptions) {
  return ts.createModuleResolutionCache(cwd, getCanonicalFileName, options)
}
