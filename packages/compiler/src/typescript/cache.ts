/**
 * @since 1.0.0
 */
import { normalize } from "node:path"
import type ts from "typescript"
import { VersionedSnapshot } from "./snapshot.js"

/**
 * @since 1.0.0
 */
export class ProjectFileCache {
  private files = new Map<string, VersionedSnapshot>()

  constructor(fileNames: Array<string>) {
    fileNames.forEach((fileName) => this.set(fileName))
  }

  /**
   * @since 1.0.0
   */
  has(fileName: string): boolean {
    const normalized = normalize(fileName)
    return this.files.has(normalized)
  }

  /**
   * @since 1.0.0
   */
  set(fileName: string, snapshot?: ts.IScriptSnapshot): void {
    const normalized = normalize(fileName)
    const file = this.files.get(normalized)
    if (!file) {
      this.files.set(normalized, new VersionedSnapshot(normalized, snapshot))
    } else {
      file.update(snapshot)
    }
  }

  /**
   * @since 1.0.0
   */
  remove(fileName: string): void {
    const normalized = normalize(fileName)
    this.files.delete(normalized)
  }

  /**
   * @since 1.0.0
   */
  removeAll(): void {
    this.files.clear()
  }

  /**
   * @since 1.0.0
   */
  getFileNames(): Array<string> {
    return Array.from(this.files.keys())
  }

  /**
   * @since 1.0.0
   */
  getVersion(fileName: string): string | undefined {
    const normalized = normalize(fileName)
    return this.files.get(normalized)?.getVersion()
  }

  /**
   * @since 1.0.0
   */
  getSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const normalized = normalize(fileName)
    return this.files.get(normalized)?.getSnapshot()
  }
}

/**
 * @since 1.0.0
 */
export class ExternalFileCache {
  /**
   * @since 1.0.0
   */
  private files = new Map<string, VersionedSnapshot>()

  /**
   * @since 1.0.0
   */
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
