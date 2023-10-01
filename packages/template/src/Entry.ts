import type { HtmlChunk } from "@typed/template/HtmlChunk"
import type { Parts } from "@typed/template/Part"
import type { Template } from "@typed/template/Template"
import type { Rendered } from "@typed/wire"

export type Entry = BrowserEntry | ServerEntry

export interface BrowserEntry {
  readonly _tag: "Browser"
  readonly template: Template
  readonly parts: Parts
  readonly rendered: () => Rendered | null
}

export interface ServerEntry {
  readonly _tag: "Server"
  readonly template: Template
  readonly chunks: ReadonlyArray<HtmlChunk>
}
