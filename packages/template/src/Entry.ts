import type { HtmlChunk } from "./HtmlChunk"
import type { Template } from "./Template"

export type Entry = BrowserEntry | ServerEntry

export interface BrowserEntry {
  readonly _tag: "Browser"
  readonly template: Template
  readonly content: DocumentFragment
}

export interface ServerEntry {
  readonly _tag: "Server"
  readonly template: Template
  readonly chunks: ReadonlyArray<HtmlChunk>
}
