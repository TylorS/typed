/**
 * @since 1.0.0
 */
import type { HtmlChunk } from "./HtmlChunk.js"
import type { Template } from "./Template.js"

/**
 * @since 1.0.0
 */
export type Entry = DomEntry | HtmlEntry

/**
 * @since 1.0.0
 */
export interface DomEntry {
  readonly _tag: "dom"
  readonly template: Template
  readonly content: DocumentFragment
}

/**
 * @since 1.0.0
 */
export interface HtmlEntry {
  readonly _tag: "html"
  readonly template: Template
  readonly chunks: ReadonlyArray<HtmlChunk>
}
