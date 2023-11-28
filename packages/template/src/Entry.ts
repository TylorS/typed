/**
 * @since 1.0.0
 */
import type { HtmlChunk } from "./HtmlChunk.js"
import type { Template } from "./Template.js"

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
