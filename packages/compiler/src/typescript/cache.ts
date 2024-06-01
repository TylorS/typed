import { normalize } from "node:path"
import type ts from "typescript"
import { VersionedSnapshot } from "./snapshot.js"

export class ProjectFileCache {
  private files = new Map<string, VersionedSnapshot>()

  constructor(fileNames: Array<string>) {
    fileNames.forEach((fileName) => this.set(fileName))
  }

  has(fileName: string): boolean {
    const normalized = normalize(fileName)
    return this.files.has(normalized)
  }

  set(fileName: string, snapshot?: ts.IScriptSnapshot): void {
    const normalized = normalize(fileName)
    const file = this.files.get(normalized)
    if (!file) {
      this.files.set(normalized, new VersionedSnapshot(normalized, snapshot))
    } else {
      file.update(snapshot)
    }
  }

  remove(fileName: string): void {
    const normalized = normalize(fileName)
    this.files.delete(normalized)
  }

  removeAll(): void {
    this.files.clear()
  }

  getFileNames(): Array<string> {
    return Array.from(this.files.keys())
  }

  getVersion(fileName: string): string | undefined {
    const normalized = normalize(fileName)
    return this.files.get(normalized)?.getVersion()
  }

  getSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const normalized = normalize(fileName)
    return this.files.get(normalized)?.getSnapshot()
  }
}

// TODO: the files in this list need to be watched. on change/delete, remove from this list and let the file be re-cached on demand
export class ExternalFileCache {
  private files = new Map<string, VersionedSnapshot>()

  getSnapshot(fileName: string): ts.IScriptSnapshot {
    const normalized = normalize(fileName)

    let file = this.files.get(normalized)
    if (!file) {
      file = new VersionedSnapshot(normalized)
      this.files.set(normalized, file)
    }

    return file.getSnapshot()
  }
}
