import ts from 'typescript'

export class VirtualModuleCache {
  protected virtualModules: Map<string, VirtualModuleSnapshot> = new Map()

  setFile(fileName: string, snapshot: ts.IScriptSnapshot): VirtualModuleSnapshot {
    const item = this.virtualModules.get(fileName)

    if (item) {
      item.updateSnapshot(snapshot)

      return item
    } else {
      const virtualModuleSnapshot = new VirtualModuleSnapshot(fileName, snapshot)

      this.virtualModules.set(fileName, virtualModuleSnapshot)

      return virtualModuleSnapshot
    }
  }

  getVirtualModuleSnapshot(fileName: string) {
    return this.virtualModules.get(fileName)
  }

  getSnapshot(fileName: string) {
    return this.virtualModules.get(fileName)?.getScriptSnapshot()
  }

  getScriptVersion(fileName: string) {
    return this.virtualModules.get(fileName)?.getScriptVersion()
  }

  getScriptKind(fileName: string) {
    return this.virtualModules.get(fileName)?.getScriptKind() ?? ts.ScriptKind.Unknown
  }

  getScriptFileNames() {
    return Array.from(this.virtualModules.keys())
  }
}

export class VirtualModuleSnapshot {
  protected version = 0

  constructor(
    readonly fileName: string,
    protected snapshot: ts.IScriptSnapshot,
  ) {}

  getScriptVersion() {
    return this.version.toString()
  }

  getScriptSnapshot() {
    return this.snapshot
  }

  getContent() {
    return getScriptSnapshotContent(this.snapshot)
  }

  getScriptKind() {
    return ts.ScriptKind.TS
  }

  updateSnapshot(snapshot: ts.IScriptSnapshot): void {
    if (getScriptSnapshotContent(snapshot) === getScriptSnapshotContent(this.snapshot)) {
      return
    }

    this.snapshot = snapshot
    this.version++
  }
}

function getScriptSnapshotContent(snapshot: ts.IScriptSnapshot) {
  return snapshot.getText(0, snapshot.getLength())
}
