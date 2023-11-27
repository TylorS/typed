/**
 * @since 1.0.0
 */
import type { HtmlChunk } from "./HtmlChunk"
import type { Template } from "./Template"

/**
 * @since 1.0.0
 */
export type Entry = BrowserEntry | ServerEntry

/**
 * @since 1.0.0
 */
export interface BrowserEntry {
  readonly _tag: "Browser"
  readonly template: Template
  readonly content: DocumentFragment
}

/**
 * @since 1.0.0
 */
export interface ServerEntry {
  readonly _tag: "Server"
  readonly template: Template
  readonly chunks: ReadonlyArray<HtmlChunk>
}
