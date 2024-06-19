/**
 * @since 1.0.0
 */

import fs from "node:fs"
import ts from "typescript"

/**
 * @since 1.0.0
 */
export class VersionedSnapshot {
  /**
   * @since 1.0.0
   */
  fileName: string

  private version: number
  private snapshot: ts.IScriptSnapshot | undefined

  constructor(fileName: string, snapshot?: ts.IScriptSnapshot) {
    this.fileName = fileName
    this.version = 1
    this.snapshot = snapshot
  }

  /**
   * @since 1.0.0
   */
  getVersion(): string {
    return this.version.toString()
  }

  /**
   * @since 1.0.0
   */
  getSnapshot(): ts.IScriptSnapshot {
    if (!this.snapshot) {
      const content = fs.readFileSync(this.fileName, "utf8")
      this.snapshot = ts.ScriptSnapshot.fromString(content)
    }
    return this.snapshot
  }

  /**
   * @since 1.0.0
   */
  update(snapshot?: ts.IScriptSnapshot): void {
    this.version++
    this.snapshot = snapshot
  }
}
