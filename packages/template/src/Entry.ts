export type Entry = BrowserEntry | ServerEntry

export interface BrowserEntry {
  readonly _tag: "Browser"
}

export interface ServerEntry {
  readonly _tag: "Server"
}
